# Import Dependencies

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import classification_report
import warnings
import json
import os
import joblib

print('Printed Important Packages')

warnings.filterwarnings('ignore')

# Import Database
from pymongo import MongoClient

print('Imported MongoDB')

uri = "mongodb+srv://kbingeabhivridh:kbingeabhivridh%40123@cluster0.nqlwryf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

db = client["test"]
collection = db["Movie"]

print('Imported Database')

df = pd.DataFrame(list(collection.find()))

df = df.sort_values(by="Name").reset_index(drop=True)
df = df.drop(["topPicks", "updatedAt", "createdAt", "__v"], axis=1)
df_copy = df.copy()

# **Database Preprocessing**

## ***Database Analysis***

# df.describe()

# Knowing the different types of genres

genre_str = df['Genre'][0]
for i in range(1, df.shape[0]):
  genre_str = genre_str + ', ' + df['Genre'][i]

genre_str_arr = genre_str.split(',')

# Trim
genre_str_arr = [genre.strip() for genre in genre_str_arr]

#Unique Genre Set
genre_str_arr = list(set(genre_str_arr))

## ***Database Cleaning***

# df.isna().sum()

# Tags contained 19 missing values
# Replaced with ''

# collection.update_many(
#     {
#         "$or": [
#             {"Tags": None},
#             {"Tags": {"$exists": False}}
#         ]
#     },
#     {
#         "$set": {"Tags": ""}
#     }
# )

# Feature Extraction and Selection**

# Genre Extraction

# Adding the Genre columns

for i in range(df.shape[0]):
  genre_category = df['Genre'][i]
  genre_category_arr = genre_category.split(',')
  genre_category_arr = [genre.strip() for genre in genre_category_arr]
  for genre in genre_category_arr:
    df.at[i, genre] = int(1)


a = list(df.columns)
print(a)
genre_str_list = a[13:44]

print(genre_str_list)

for genre in genre_str_list:
  df[genre] = df[genre].fillna(int(0))
  df[genre] = df[genre].astype(int)


# Content Encoding

# 15+ - Teens 15 or older   - 0
# 13+ - Teens 13 or older   - 0
# 18+ Restricted (violence & profanity) , R - Restricted Screening (nudity & violence) - 1
# G - All Ages - 2
# Not Yet Rated - 3

#Replcaing content rating values with numbers - label encoding
df['Content Rating'] = df['Content Rating'].replace(
    {
      '13+ - Teens 13 or older' : 0, '15+ - Teens 15 or older':0,
      '18+ Restricted (violence & profanity)':1, 'R - Restricted Screening (nudity & violence)':1,
      'G - All Ages':2,
      'Not Yet Rated':3
    }
  )

for i in range(df.shape[0]):
    if df['Content Rating'][i] == 0:
        df.at[i, 'Teens'] = 1
    elif df['Content Rating'][i] == 1:
        df.at[i, 'Restricted'] = 1
    elif df['Content Rating'][i] == 2:
        df.at[i, 'All Ages'] = 1
    elif df['Content Rating'][i] == 3:
        df.at[i, 'Not Yet Rated'] = 1
    else:
        print('Error in content rating value')


df['Teens'] = df['Teens'].fillna(0).astype(int)

df['Restricted'] = df['Restricted'].fillna(0).astype(int)

df['All Ages'] = df['All Ages'].fillna(0).astype(int)

df['Not Yet Rated'] = df['Not Yet Rated'].fillna(0).astype(int)

# Episode Encoding

def extract_episode(x):
  if pd.isna(x):
      return 0

  x = x.split(' ')
  num = int(x[0])
  return num

df['Episode'] = df['Episode'].apply(extract_episode)

# Removing Unwanted Features***

df = df.drop(columns=['_id', 'Unnamed: 0', 'img url', 'Genre', 'Content Rating'])

# Seperating Textual and Numeric Features***

text_features = []
numeric_features = []
for col in df.columns:
  if df[col].dtype == 'str':
    text_features.append(col)
  else:
    numeric_features.append(col)

print('Textual Features and Numeric Features')
print('-----------------------------------')
print('Textual Features:\n', text_features)
print('Numeric Features:\n', numeric_features)
print('-----------------------------------')

#Numeric features are divided into binary valued and continuous valued
numeric_features_binary = numeric_features[3:]
numeric_features_continuous = numeric_features[:3]

text_features_df = df['Name'] + ' ' + df['Name'] + df['Sinopsis'] + ' '+ df['Sinopsis'] + ' ' + df['Sinopsis'] + ' ' + df['Sinopsis'] + ' ' + df['Sinopsis'] + ' ' + df['Tags'] + ' ' + df['Tags'] + ' ' + df['Tags'] + ' ' + df['Tags'] + ' ' + df['Tags'] + ' ' + df['Network'] + ' ' + df['Main Cast']
numeric_features_binary_df = df[numeric_features_binary]
numeric_features_continuous_df = df[numeric_features_continuous]


#Text vectorizer
from sklearn.feature_extraction.text import TfidfVectorizer

vectorizer = TfidfVectorizer()
text_features_df = vectorizer.fit_transform(text_features_df)

#Standard Scaler
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
numeric_features_continuous_df = scaler.fit_transform(numeric_features_continuous_df)


from scipy.sparse import hstack

final_vectors = hstack([
    text_features_df,
    numeric_features_continuous_df,
    numeric_features_binary_df
])

import difflib

# Importing sklearn for cosine similarity
from sklearn.metrics.pairwise import cosine_similarity

#for accurate name matches
from rapidfuzz import process

similarity = cosine_similarity(final_vectors)


def recommend_drama (movie_name_arg):
  while True:
    drama_name = movie_name_arg.lower()
    try:
      list_of_all_drama_names = df['Name'].tolist()
      find_close_match = difflib.get_close_matches(drama_name, list_of_all_drama_names)
      print(find_close_match)
      close_match = find_close_match[0]
      print(close_match)
      index_of_drama_name = np.where(df['Name'] == close_match)[0][0]
      print(index_of_drama_name)
      break
    except:
      print('No such movie found in difflib method')
      return {
        'Error': 'No such movie found in difflib method'
      }
  similarity_scores = list(enumerate(similarity[index_of_drama_name]))
  sorted_similarity_scores = sorted(similarity_scores, key = lambda x:x[1], reverse=True)
  result = {}
  limit = 5
  for i in range(1, limit+1):
    index = sorted_similarity_scores[i][0]
    probability = sorted_similarity_scores[i][1] * 100
    recommended_drama_name = df['Name'][index]
    result[recommended_drama_name] = float(probability)
  return result



# recommend_movie('The Dark Knight')
print(recommend_drama('Flower of Evil'))
movies_json = {}
for i in range(df.shape[0]):
   movie_name = df['Name'][i]
   movies_json[movie_name] = i

os.makedirs('../files', exist_ok=True)
with open('../files/movies.json', 'w') as file:
    json.dump(movies_json, file, indent=4)

joblib.dump(similarity, '../files/similarity_matrix.pkl')
joblib.dump(vectorizer, '../files/vectorizer.pkl')
joblib.dump(scaler, '../files/scaler.pkl')
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import joblib
import difflib

app = FastAPI()

# enable CORS for all origins (adjust `allow_origins` as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open('files/movies.json','r') as file:
    movies_json = json.load(file)

movies_json = {k: int(v) for k, v in movies_json.items()}
movies_json_index_to_movie = {v: k for k, v in movies_json.items()}
movies_json_lower_to_index = {k.lower(): v for k, v in movies_json.items()}

similarity = joblib.load('files/similarity_matrix.pkl')

@app.get('/kbinge/root')
def root():
    return {
        'message': 'KBinge Recommendation System API Root',
        'status': 200,
        'ok':True
    }

@app.get('/kbinge/recommend/{movie_name}')
def recommend(movie_name: str):
    movie_name_arg = movie_name.lower()
    try:
        list_of_all_drama_names = list(movies_json_lower_to_index.keys())
        closest_match = difflib.get_close_matches(movie_name_arg, list_of_all_drama_names)[0]
        index_of_drama_name = movies_json_lower_to_index[closest_match]
    except IndexError as e:
        return {
            'message' : 'No such movie found in database',
            'status' : 404,
            'ok':False,
            'error': type(e).__name__,
            'error_message': str(e)
        }
    similarity_scores = list(enumerate(similarity[index_of_drama_name]))
    sorted_similarity_scores = sorted(similarity_scores, key = lambda x:x[1], reverse=True)
    result = {}
    limit = 5
    for i in range(1, limit+1):
        index = sorted_similarity_scores[i][0]
        probability = round(float(sorted_similarity_scores[i][1]) * 100, 2)
        recommended_drama_name = movies_json_index_to_movie[index]
        result[recommended_drama_name] = probability
    return {
        'message' : 'Recommendations generated successfully',
        'status' : 200,
        'ok':True,
        'data': result
    }   
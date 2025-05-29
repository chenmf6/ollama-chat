# pull ollama
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
# run llama 3.2 model
docker exec -it ollama ollama run llama3.2
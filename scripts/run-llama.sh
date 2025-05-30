# pull
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
# or start
docker start ollama
# run
docker exec -it ollama ollama run llama3.2
# stop
docker stop ollama
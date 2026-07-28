# im
## Para depuración local se puede usar http, para producción es obligatorio usar https 


# docker

```
docker build -t appim:1.0 .

docker run --name="appim" -p 9444:3000 -p 9443:443 -d appim:1.0
```

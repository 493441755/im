# im
## 本地调试可以用http 线上必须用https

# docker

```
docker build -t appim:1.0 .

docker run --name="appim" -p 9444:3000 -p 9443:443 -d appim:1.0
```

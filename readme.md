If you want to run the server:
```
    docker-compose down
    docker-compose build
    docker-compose up
```
Then connect to localhost:3000

If you want to add a new npm dependency you might have better luck running this:
```
    docker-compose run stream npm i --save DEPENDENCY
```
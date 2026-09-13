# TODOs API

This service is written in NodeJS, it provides CRUD operations over TODO entries.
It keeps all the data in memory. CREATE and DELETE operations are logged by
sending appropriate message to a Redis queue. The messages are then processed by
`log-message-processor`.

- `GET /todos` - list all TODOs for a given user
- `POST /todos` - create new TODO
- `DELETE /todos/:taskId` - delete a TODO by ID

TODO object looks like this:
```
{
    id: 1,
    userId: 1,
    content: "Create new todo"
}
```
Log message looks like this:
```
{
    opName: CREATE,
    username: username,
    todoId: 5,
}
```

## Configuration

The service scans environment for variables:
- `TODO_API_PORT` - the port the service takes.
- `JWT_SECRET` - secret value for JWT token processing. Must be the same amongst all components.
- `REDIS_HOST` - host of Redis
- `REDIS_PORT` - port of Redis
- `REDIS_CHANNEL` - channel the processor is going to listen to

## Metrics

Metrics are recorded through OpenTelemetry. `metrics.js` builds a meter provider
whose Prometheus exporter serves `GET /metrics` on `TODO_API_PORT`, without scope
labels, `target_info`, or runtime metrics. The route needs no JWT.

- `todo_api_requests_total{method,status}` - requests handled
- `todo_api_request_duration_seconds{method}` - request duration histogram
- `todo_api_todos_created_total` - todos stored by a create request
- `todo_api_todos_deleted_total` - todos deleted whose id existed (a delete of a missing id still answers 204 but is not counted)

## Building

```
npm install
```
## Running
```
JWT_SECRET=PRFT TODO_API_PORT=8082 npm start
```

## Usage
The API can be exercised as follows:
```
 curl -X POST -H "Authorization: Bearer $token" http://127.0.0.1:8082/todos -d '{"content": "deal with that"}'
```
where `$token` is the token returned by [Auth API](/auth-api).

## Dependencies
The software required to run this microservice, and the version that was tested:
|  Dependency | Version  |
|-------------|----------|
| Node        | 8.17.0   |
| NPM         | 6.13.4   |
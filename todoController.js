'use strict';
const cache = require('memory-cache');
const { publishAudit } = require('./operational');
const {Annotation, 
    jsonEncoder: {JSON_V2}} = require('zipkin');

const OPERATION_CREATE = 'CREATE',
      OPERATION_DELETE = 'DELETE';

class TodoController {
    constructor({tracer, redisClient, logChannel, redisBreaker, redisPublishTimeoutMs}) {
        this._tracer = tracer;
        this._redisClient = redisClient;
        this._logChannel = logChannel;
        this._redisBreaker = redisBreaker;
        this._redisPublishTimeoutMs = redisPublishTimeoutMs || 1000;
    }

    // TODO: these methods are not concurrent-safe
    list (req, res) {
        const data = this._getTodoData(req.user.username)

        res.json(data.items)
    }

    create (req, res) {
        // TODO: must be transactional and protected for concurrent access, but
        // the purpose of the whole example app it's enough
        const data = this._getTodoData(req.user.username)
        const todo = {
            content: req.body.content,
            id: data.lastInsertedID
        }
        data.items[data.lastInsertedID] = todo

        data.lastInsertedID++
        this._setTodoData(req.user.username, data)

        this._logOperation(OPERATION_CREATE, req.user.username, todo.id, req.correlationId)

        res.json(todo)
    }

    delete (req, res) {
        const data = this._getTodoData(req.user.username)
        const id = req.params.taskId
        delete data.items[id]
        this._setTodoData(req.user.username, data)

        this._logOperation(OPERATION_DELETE, req.user.username, id, req.correlationId)

        res.status(204)
        res.send()
    }

    // Best-effort audit write.
    //
    // Redis carries the audit log, not the todos, so a Redis failure must cost
    // the audit line and nothing else. publishAudit contains all three ways
    // this can go wrong — an error callback, a synchronous throw, and a call
    // that never settles — and always resolves, so the response is never held
    // open waiting on a logging dependency.
    //
    // Deliberately not awaited: the write has already succeeded by the time
    // this runs, and awaiting would put Redis latency back on the request path.
    _logOperation (opName, username, todoId, correlationId) {
        this._tracer.scoped(() => {
            const traceId = this._tracer.id;
            const message = JSON.stringify({
                zipkinSpan: traceId,
                opName: opName,
                username: username,
                todoId: todoId,
                correlationId: correlationId,
            });

            publishAudit(this._redisClient, this._logChannel, message, {
                timeoutMs: this._redisPublishTimeoutMs,
                breaker: this._redisBreaker,
            });
        })
    }

    _getTodoData (userID) {
        var data = cache.get(userID)
        if (data == null) {
            data = {
                items: {
                    '1': {
                        id: 1,
                        content: "Create new todo",
                    },
                    '2': {
                        id: 2,
                        content: "Update me",
                    },
                    '3': {
                        id: 3,
                        content: "Delete example ones",
                    }
                },
                lastInsertedID: 3
            }

            this._setTodoData(userID, data)
        }
        return data
    }

    _setTodoData (userID, data) {
        cache.put(userID, data)
    }
}

module.exports = TodoController
'use strict';
const cache = require('memory-cache');
const { SpanKind, SpanStatusCode, context, propagation } = require('@opentelemetry/api');
const { publishAudit } = require('./operational');
const { tracer } = require('./tracing');

const OPERATION_CREATE = 'CREATE',
      OPERATION_DELETE = 'DELETE';

class TodoController {
    constructor({redisClient, logChannel, redisBreaker, redisPublishTimeoutMs, metrics}) {
        this._redisClient = redisClient;
        this._logChannel = logChannel;
        this._redisBreaker = redisBreaker;
        this._redisPublishTimeoutMs = redisPublishTimeoutMs || 1000;
        // Business counters (gitops spec 011); a no-op when none is supplied.
        this._metrics = metrics || { todoCreated () {}, todoDeleted () {} };
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

        this._metrics.todoCreated()
        res.json(todo)
    }

    delete (req, res) {
        const data = this._getTodoData(req.user.username)
        const id = req.params.taskId
        // The response stays 204 for a missing id, but only a real deletion counts.
        const existed = Object.prototype.hasOwnProperty.call(data.items, id)
        delete data.items[id]
        this._setTodoData(req.user.username, data)
        if (existed) {
            this._metrics.todoDeleted()
        }

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
    //
    // The publish is a PRODUCER span, and the message carries that span's W3C
    // context (spec 010): log-message-processor continues the trace from here.
    // Without started tracing the span is a no-op and the message carries no
    // trace context, which the contract allows.
    _logOperation (opName, username, todoId, correlationId) {
        tracer().startActiveSpan(`${this._logChannel} publish`, {
            kind: SpanKind.PRODUCER,
            attributes: {
                'messaging.system': 'redis',
                'messaging.destination.name': this._logChannel,
                'messaging.operation.type': 'publish',
            },
        }, span => {
            const traceContext = {};
            propagation.inject(context.active(), traceContext);
            const message = JSON.stringify({
                opName: opName,
                username: username,
                todoId: todoId,
                correlationId: correlationId,
                ...traceContext,
            });

            publishAudit(this._redisClient, this._logChannel, message, {
                timeoutMs: this._redisPublishTimeoutMs,
                breaker: this._redisBreaker,
            }).then(result => {
                if (!result.published) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: result.reason });
                }
                span.end();
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
class ApiError extends Error {               // extends built-in Error class
    constructor(
        statusCode,                          // HTTP status (400, 401, 404, 500)
        message = "Something went wrong",
        errors = [],                         // extra error details (array)
        stack = ""                           // custom stack trace (optional)
    ){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.data = null;
        this.success = false;
        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};
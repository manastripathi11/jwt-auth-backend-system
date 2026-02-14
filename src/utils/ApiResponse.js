class ApiResponse {
    constructor(statusCode, data, message="success"){
        this.statusCode = statusCode;  // HTTP status code (200, 201, etc.)
        this.data = data;                  // response payload (object/array)
        this.message = message;          // optional message (string)
        this.success = statusCode < 400             // indicates successful response
    }
}

export { ApiResponse };
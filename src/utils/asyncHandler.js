const asyncHandler = (requestHandler) => {                  // Higher-order function to handle async errors
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).    // either use try-catch or Promise.resolve
        catch((err) => next(err));
    };
}

export {asyncHandler};
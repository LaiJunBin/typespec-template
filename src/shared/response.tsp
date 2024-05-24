import "@typespec/http";

using TypeSpec.Http;

namespace Shared;

model APIResponse<T, StatusCode = 200> {
    @statusCode statusCode: StatusCode;
    data: T;
    success: boolean;
}

model APINoDataResponse<StatusCode = 200> {
    @statusCode statusCode: StatusCode;
    success: boolean;
}

@error
model APIErrorResponse<StatusCode = 400, Message = "Bad Request"> {
    @statusCode statusCode: StatusCode;
    message: Message;
    success: boolean;
}

model APIBadRequestResponse is APIErrorResponse<400, "Bad Request">;
model APIUnauthorizedResponse is APIErrorResponse<401, "Unauthorized">;

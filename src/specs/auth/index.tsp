import "./model.tsp";
import "@typespec/http";

using TypeSpec.Http;
using Shared;

@tag("Auth")
@route("/auth")
namespace AuthSpec;

model LoginRequest {
    username: string;
    password: string;
}

alias LoginResponse = APIResponse<string> | APIBadRequestResponse;
alias LogoutResponse = APINoDataResponse | APIBadRequestResponse | APIUnauthorizedResponse;
alias getProfileResponse = APIResponse<Profile> | APIBadRequestResponse | APIUnauthorizedResponse;

interface Interface {
    @post
    @route("/login")
    login(@body payload: LoginRequest): LoginResponse;
}

interface AuthedInterface {
    @post
    @route("/logout")
    logout(): LogoutResponse;

    @get
    @route("/profile")
    getProfile(): getProfileResponse;
}

// Code is auto-generated. DO NOT EDIT.

import "@typespec/http";
import "./src/shared/authorization.tsp";
import "./src/shared/response.tsp";
import "./src/specs/auth/index.tsp";
import "./src/specs/auth/model.tsp";

using TypeSpec.Http;
using Shared;
    
@service({
    title: "Main Service",
})
@server("http://localhost:3000", "MainServer")

namespace MainService;

namespace AuthSpecImpl {
  @tag("Auth")
  @route("/auth")
  interface Interface extends AuthSpec.Interface {}

  @tag("Auth")
  @route("/auth")
  @useAuth(Authorization)
  interface AuthedInterface extends AuthSpec.AuthedInterface {}
}

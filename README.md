# Typespec Template

This is a template for my [typespec](https://typespec.io/) project, it implements a simple code-generation tool and hot-reloading server for typespec projects.

## Main Project Structure

```
.
├── src
│   ├── shared
│   │   ├── authorization.tsp
│   │   ├── response.tsp
│   │   └── ...
│   ├── specs
│   │   ├── auth
│   │   │   ├── index.tsp
│   │   │   ├── model.tsp
│   │   │   └── ...
│   │   └── ...
├── main.tsp
├── .env

```

---

## Getting Started

You can use other package manager to install the dependencies and run the project, I'll be using npm in this example.

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

This will generate a `main.tsp` file in the root of the project and generate the tsp-output(such as `openapi.yaml`)

---

## How it works

The project is divided into two main parts, the `src/shared` and `src/specs` folders.

### Shared

namespace: `Shared`

This folder contains all the shared typespec files, and it will automatically imports all files into the `main.tsp` file.

### Specs

This folder contains all the specs for the project, each folder represents a different spec, and it will automatically imports all files into the `main.tsp` file and bundle all namespaces and interfaces.

The interface is divided into two parts, the `Interface` and `AuthedInterface`, the `AuthedInterface` is a special interface that requires the user to be authenticated to access it.

The Authorizations samples can be found in the `src/shared/authorization.tsp` file, it contains a `authorization` alias, it will be used to `@useAuth` decorator, which will automatically generate to all `Operation` in the `AuthedInterface`.

Every spec file should have `namespace` defined, and you can define `@tag` and `@route` to `namespace` before, it will effect all `Operation`, otherwise, you can define `@tag` and `@route` to `Operation` directly.

The tool also supports nested `namespace`, it will automatically generate the nested `namespace` and `interface` in the output file, allowing you to organize your code within a folder structure.

Finally, the `model.tsp` isn't required, you can split your source code into multiple files, because the `main.tsp` will automatically import all files in the `src/specs` folder.

### Environment Variables
* `SERVICE_TITLE` - The title of the service
* `SERVER_NAME` - The name of the server
* `SERVER_URL` - The server URL
* `BUILD_PATH` - The path to the generated file

---

## Example

This project contains `./src/specs/auth` folder, and `index.tsp` has the following definition at the top level:

```typespec
@tag("Auth")
@route("/auth")
namespace AuthSpec;
```

and two interface definitions, `Interface` and `AuthedInterface`, so it will generate the below code in the output file:

```typespec
namespace AuthSpecImpl {
  @tag("Auth")
  @route("/auth")
  interface AuthSpecInterface extends AuthSpec.Interface {}

  @tag("Auth")
  @route("/auth")
  @useAuth(Authorization)
  interface AuthSpecAuthedInterface extends AuthSpec.AuthedInterface {}
}
```

In addition, the output file will auto-import, like this:

```typespec
import "./src/specs/auth/index.tsp";
import "./src/specs/auth/model.tsp";
```

Finally, generate openapi.yaml file:

```yaml
openapi: 3.0.0
info:
  title: Main Service
  version: 0.0.0
tags:
  - name: Auth
paths:
  /auth/login:
    post:
      tags:
        - Auth
      operationId: AuthSpecInterface_login
      parameters: []
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                type: object
                required:
                  - data
                  - success
                properties:
                  data:
                    type: string
                  success:
                    type: boolean
        '400':
          description: The server could not understand the request due to invalid syntax.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shared.APIBadRequestResponse'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuthSpec.LoginRequest'
  /auth/logout:
    post:
      tags:
        - Auth
      operationId: AuthSpecAuthedInterface_logout
      parameters: []
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                type: object
                required:
                  - success
                properties:
                  success:
                    type: boolean
        '400':
          description: The server could not understand the request due to invalid syntax.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shared.APIBadRequestResponse'
        '401':
          description: Access is unauthorized.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shared.APIUnauthorizedResponse'
      security:
        - BearerAuth: []
  /auth/profile:
    get:
      tags:
        - Auth
      operationId: AuthSpecAuthedInterface_getProfile
      parameters: []
      responses:
        '200':
          description: The request has succeeded.
          content:
            application/json:
              schema:
                type: object
                required:
                  - data
                  - success
                properties:
                  data:
                    $ref: '#/components/schemas/AuthSpec.Profile'
                  success:
                    type: boolean
        '400':
          description: The server could not understand the request due to invalid syntax.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shared.APIBadRequestResponse'
        '401':
          description: Access is unauthorized.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shared.APIUnauthorizedResponse'
      security:
        - BearerAuth: []
components:
  schemas:
    AuthSpec.LoginRequest:
      type: object
      required:
        - username
        - password
      properties:
        username:
          type: string
        password:
          type: string
    AuthSpec.Profile:
      type: object
      required:
        - name
        - username
      properties:
        name:
          type: string
        username:
          type: string
    Shared.APIBadRequestResponse:
      type: object
      required:
        - message
        - success
      properties:
        message:
          type: string
          enum:
            - Bad Request
        success:
          type: boolean
    Shared.APIUnauthorizedResponse:
      type: object
      required:
        - message
        - success
      properties:
        message:
          type: string
          enum:
            - Unauthorized
        success:
          type: boolean
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
servers:
  - url: http://localhost:3000
    description: MainServer
    variables: {}
```

---

## Next Steps?

You can use openapi.yaml to generate source code through various tools to improve your development efficiency.

---

Happy coding!

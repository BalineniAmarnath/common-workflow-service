const {
	UserNotConfirmedException,
	NotAuthorizedException,
	UsernameExistsException,
} = require("@aws-sdk/client-cognito-identity-provider")
const { AuthorizationError } = require("./authorizer")

exports.errorHandler = () => ({
	onError: (handler) => {
		console.log(handler.error.code);
		if (handler.error instanceof AuthorizationError) {
			handler.response = {
				statusCode: 403,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "unauthorised request",
				}),
			}
		}
		if (handler.error instanceof UserNotConfirmedException) {
			handler.response = {
				statusCode: 403,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "email not verified",
				}),
			}
		}
		if (handler.error instanceof NotAuthorizedException) {
			handler.response = {
				statusCode: 409,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Incorrect username or password.",
				}),
			}
		}
		if (handler.error instanceof UsernameExistsException) {
			handler.response = {
				statusCode: 401,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "user already exists.",
				}),
			}
		}
		if (handler.error.code === 23505) {
			handler.response = {
				statusCode: 401,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Alrady exists.",
				}),
			}
		}
		handler.response = {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: handler.error.message,
				error: handler.error,
			}),
		}
	},
})

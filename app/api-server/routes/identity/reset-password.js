const joi = require('joi')

const identityService = require('../../services/identity')

module.exports = [{
	method: 'POST',
	path: '/identity/reset-password',
	config: {
		auth: false,
		validate: {
			payload: joi.object({
				token: joi.string().min(16).required(),
				password: joi.string().min(8).required()
			})
		}
	},
	handler: async (request, h) => {
		const result = await identityService.resetPassword(request.payload)
		return h.response(result).code(200)
	}
}]

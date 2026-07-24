const joi = require('joi')

const identityService = require('../../services/identity')

module.exports = [{
	method: 'POST',
	path: '/identity/forgot-password',
	config: {
		auth: false,
		validate: {
			payload: joi.object({
				email: joi.string().email().required()
			})
		}
	},
	handler: async (request, h) => {
		const result = await identityService.forgotPassword(request.payload)
		return h.response(result).code(200)
	}
}]

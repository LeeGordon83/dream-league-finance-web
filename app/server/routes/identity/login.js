const joi = require('joi')

const identityService = require('../../services/identity')

module.exports = [{
	method: 'POST',
	path: '/identity/login',
	config: {
		auth: false,
		validate: {
			payload: joi.object({
				email: joi.string().email().required(),
				password: joi.string().min(8).required()
			})
		}
	},
	handler: async (request, h) => {
		const result = await identityService.login(request.payload)
		return h.response(result).code(200)
	}
}]

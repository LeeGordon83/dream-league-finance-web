const joi = require('joi')

const identityService = require('../../services/identity')

module.exports = [{
	method: 'POST',
	path: '/identity/register',
	config: {
		auth: false,
		validate: {
			payload: joi.object({
				managerName: joi.string().trim().min(2).required(),
				email: joi.string().email().required(),
				password: joi.string().min(8).required()
			})
		}
	},
	handler: async (request, h) => {
		const result = await identityService.register(request.payload)
		return h.response(result).code(201)
	}
}]

const api = require('../../api')
const joi = require('joi')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
	if (!isInRole(request.auth.credentials, 'admin')) {
		return h.redirect('/').takeover()
	}

	return h.continue
}

const emptyUpdate = {
	generatedAt: null,
	currentWeek: null,
	latestRecordedWeek: null,
	weeklyWinners: [],
	jackpotWinners: [],
	alreadyRecorded: false,
	hasWeeklyForCurrentWeek: null
}

module.exports = [{
	method: 'GET',
	path: '/admin/weekly-update',
	config: {
		pre: [requireAdmin]
	},
	handler: async (request, h) => {
		try {
			const update = await api.get('/admin/weekly-update', request.dl_token)
			return h.view('admin/weekly-update', { update, error: null })
		} catch (_error) {
			return h.view('admin/weekly-update', {
				update: emptyUpdate,
				error: { message: 'Could not load latest weekly winners right now.' }
			})
		}
	}
}, {
	method: 'POST',
	path: '/admin/weekly-update',
	config: {
		pre: [requireAdmin],
		validate: {
			payload: joi.object({
				weekId: joi.number().integer().min(1).required()
			}),
			failAction: (_request, h, _error) => h.redirect('/admin/weekly-update').takeover()
		}
	},
	handler: async (request, h) => {
		try {
			await api.post('/admin/weekly-update', { weekId: request.payload.weekId }, request.dl_token)
			return h.redirect('/admin/weekly-update')
		} catch (error) {
			const update = await api.get('/admin/weekly-update', request.dl_token).catch(() => emptyUpdate)
			return h.view('admin/weekly-update', {
				update,
				error: {
					message: error?.data?.payload?.error || 'Could not record weekly winnings right now.'
				}
			}).code(400)
		}
	}
}]

const api = require('../../api')
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
}]

const prisma = require("../config/database");

const getLeaderboard = async () => {
	const results = await prisma.result.findMany({
		where: {
			status: {
				in: ["PASS", "FAIL"],
			},
		},
		select: {
			percentage: true,
			student: {
				select: {
					id: true,
					fullName: true,
					registrationNumber: true,
				},
			},
			exam: {
				select: {
					course: {
						select: {
							id: true,
							name: true,
							code: true,
						},
					},
				},
			},
		},
	});

	const grouped = new Map();

	for (const result of results) {
		const studentId = result.student.id;
		const entry = grouped.get(studentId) || {
			student: result.student,
			scores: [],
			courses: new Map(),
		};

		entry.scores.push(Number(result.percentage) || 0);
		if (result.exam.course) {
			entry.courses.set(result.exam.course.id, result.exam.course);
		}
		grouped.set(studentId, entry);
	}

	return [...grouped.values()]
		.map((entry) => ({
			student: entry.student,
			course: [...entry.courses.values()][0] || null,
			averageScore: Number(
				(entry.scores.reduce((total, score) => total + score, 0) / entry.scores.length).toFixed(2)
			),
			attempts: entry.scores.length,
		}))
		.sort((left, right) => right.averageScore - left.averageScore)
		.map((entry, index) => ({
			rank: index + 1,
			...entry,
		}));
};

module.exports = {
	getLeaderboard,
};

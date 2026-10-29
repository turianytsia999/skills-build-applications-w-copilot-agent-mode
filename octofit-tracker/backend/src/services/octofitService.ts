import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    badRequest('A valid userId is required');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    badRequest('A valid teamId is required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    badRequest('An activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) badRequest('The referenced user and team must exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    badRequest('Team input must be an object');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) {
    badRequest('A team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    badRequest('A team mascot is required');
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((memberId) => typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId))) {
    badRequest('Team members must be valid user IDs');
  }

  const uniqueMemberIds = [...new Set(memberIds as string[])];
  if (uniqueMemberIds.length > 0) {
    const users = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
    const foundIds = new Set(users.map((user) => user._id.toString()));
    if (uniqueMemberIds.some((memberId) => !foundIds.has(memberId))) {
      badRequest('All team members must exist');
    }
  }

  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.toLowerCase();
  const recentType = recentActivity?.type.toLowerCase();
  const rankedWorkouts = workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = focus === recentType;
      return { workout, matchesGoal, matchesActivity };
    })
    .filter(({ matchesGoal, matchesActivity }) => matchesGoal || matchesActivity)
    .sort((left, right) => {
      if (left.matchesGoal !== right.matchesGoal) return left.matchesGoal ? -1 : 1;
      return (left.workout.title ?? '').localeCompare(right.workout.title ?? '');
    });

  return rankedWorkouts.map(({ workout, matchesGoal, matchesActivity }) => ({
    ...workout,
    reason: matchesGoal
      ? `Supports your ${user.fitnessGoal} fitness goal.`
      : `Recommended based on your recent ${recentActivity?.type} activity.`,
  }));
}

export { User };

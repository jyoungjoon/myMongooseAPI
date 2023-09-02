const express = require('express');
const router = express.Router();
const { User, Thought } = require('../models');

router.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('thoughts friends');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('thoughts friends');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const deletedUser = await User.findByIdAndRemove(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Thought.deleteMany({ _id: { $in: deletedUser.thoughts } });
    res.json(deletedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/api/users/:userId/friends/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.friends.push(friendId);
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

router.delete('/api/users/:userId/friends/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.friends = user.friends.filter(
      (friend) => friend.toString() !== friendId
    );
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

router.get('/api/thoughts', async (req, res) => {
  try {
    const thoughts = await Thought.find();
    res.json(thoughts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch thoughts' });
  }
});

router.get('/api/thoughts/:thoughtId', async (req, res) => {
  const { thoughtId } = req.params;
  try {
    const thought = await Thought.findById(thoughtId);
    if (!thought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    res.json(thought);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch thought' });
  }
});

router.post('/api/thoughts', async (req, res) => {
  try {
    const { thoughtText, username, userId } = req.body;
    const thought = await Thought.create({ thoughtText, username, userId });
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.thoughts.push(thought._id);
    await user.save();
    res.status(201).json(thought);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create thought' });
  }
});

router.put('/api/thoughts/:thoughtId', async (req, res) => {
  const { thoughtId } = req.params;
  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      thoughtId,
      req.body,
      { new: true }
    );
    if (!updatedThought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    res.json(updatedThought);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update thought' });
  }
});

router.delete('/api/thoughts/:thoughtId', async (req, res) => {
  const { thoughtId } = req.params;
  try {
    const deletedThought = await Thought.findByIdAndRemove(thoughtId);
    if (!deletedThought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    const user = await User.findById(deletedThought.userId);
    if (user) {
      user.thoughts = user.thoughts.filter(
        (thought) => thought.toString() !== thoughtId
      );
      await user.save();
    }
    res.json(deletedThought);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete thought' });
  }
});

router.post('/api/thoughts/:thoughtId/reactions', async (req, res) => {
  const { thoughtId } = req.params;
  try {
    const thought = await Thought.findById(thoughtId);
    if (!thought) {
      return res.status(404).json({ message: 'Thought not found' });
    }

    const newReaction = {
      reactionBody: req.body.reactionBody,
      username: req.body.username,
      userId: req.body.userId,
    };

    thought.reactions.push(newReaction);
    await thought.save();
    res.status(201).json(thought);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reaction' });
  }
});

router.delete(
  '/api/thoughts/:thoughtId/reactions/:reactionId',
  async (req, res) => {
    const { thoughtId, reactionId } = req.params;
    try {
      const thought = await Thought.findById(thoughtId);
      if (!thought) {
        return res.status(404).json({ message: 'Thought not found' });
      }

      thought.reactions = thought.reactions.filter(
        (reaction) => reaction.reactionId.toString() !== reactionId
      );

      await thought.save();
      res.json(thought);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  }
);

module.exports = router;

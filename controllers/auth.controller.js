import { signupService, signinService, googleAuthService } from '../services/auth.service.js';

export const signup = async (req, res, next) => {
  try {
    await signupService(req.body);
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { token, user } = await signinService(req.body);
    res
      .status(200)
      .cookie('access_token', token, { httpOnly: true })
      .json(user);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const { token, user } = await googleAuthService(req.body);
    res
      .status(200)
      .cookie('access_token', token, { httpOnly: true })
      .json(user);
  } catch (error) {
    next(error);
  }
};

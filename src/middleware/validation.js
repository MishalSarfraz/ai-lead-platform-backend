export function validateLeadInput(req, res, next) {
  const { name, email, message, budget } = req.body;

  // Check required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ 
      success: false, 
      error: 'Message/requirements must be at least 5 characters long.' 
    });
  }

  // If budget is supplied, ensure it's a positive number
  if (budget !== undefined && budget !== null && budget !== '') {
    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      return res.status(400).json({ success: false, error: 'Budget must be a valid positive number.' });
    }
  }

  next();
}
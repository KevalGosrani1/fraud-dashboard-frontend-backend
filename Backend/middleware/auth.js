// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.log("=== AUTH DEBUG ===");
  const authHeader = req.headers["authorization"];
  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    console.log("❌ Missing header");
    return res.status(403).send("No authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  console.log("Scheme:", scheme);
  console.log("Token:", token);

  if (scheme !== "Bearer" || !token) {
    console.log("❌ Invalid scheme or missing token");
    return res.status(403).send("Invalid authorization format");
  }

  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      issuer: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/auth/v1`
    });

    console.log("✅ Supabase token verified:", payload);

    req.user = {
      email: payload.email,
      role: payload.role,
      sub: payload.sub
    };

    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).send("Invalid token");
  }
};

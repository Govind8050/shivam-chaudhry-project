const bcrypt = require("bcryptjs");
const Admin = require("./Admin");

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.log("⚠️ ADMIN_EMAIL / ADMIN_PASSWORD not set, admin not created");
    return;
  }

  // Sirf ek hi admin rakhna hai: baaki sab hata do
  await Admin.destroy({ where: { email: { [require("sequelize").Op.ne]: email } } });

  const existing = await Admin.findOne({ where: { email } });

  if (!existing) {
    await Admin.create({ email, password: await bcrypt.hash(password, 10) });
    console.log("✅ Admin created in admins table");
    return;
  }

  const same = await bcrypt.compare(password, existing.password);
  if (!same) {
    existing.password = await bcrypt.hash(password, 10);
    await existing.save();
    console.log("✅ Admin password updated");
  }
}

module.exports = seedAdmin;
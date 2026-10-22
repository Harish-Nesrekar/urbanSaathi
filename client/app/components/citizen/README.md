# UrbanSathi citizen pages

These files split the citizen portal into route pages and reusable components.

## Install animation dependency
From `client/`, run:
```bash
npm install framer-motion
```
If this project uses pnpm:
```bash
pnpm add framer-motion
```

## Assumptions to verify
- The backend runs on `http://localhost:5001` or `NEXT_PUBLIC_API_BASE_URL` is configured.
- JWT token is stored in localStorage or sessionStorage under `token`.
- `GET /api/test/protected` returns `user.role` and `user.id`.
- Existing map component is at `app/citizen/dashboard/locationPicker` and exports a default component with `latitude`, `longitude`, `onLocationSelect`, and `onPlaceSelect` props.
- Existing profile endpoints accept `{ full_name }` at `/api/profile/request-update`, `{ otp }` at `/api/profile/verify-update`, and `{ currentPassword, newPassword }` at `/api/profile/change-password`.
- Existing complaint endpoints match the routes used in the current dashboard.

## Important
Keep your original dashboard backup until you have tested all routes. If `@/` is not configured in `tsconfig.json`, replace aliases with relative imports or configure `baseUrl` and `paths`.

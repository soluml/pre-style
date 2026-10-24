import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('merge', 'routes/merge.tsx'),
  route('server', 'routes/server.tsx'),
] satisfies RouteConfig;

import { remultSveltekit } from "remult/remult-sveltekit";
import { entities } from "../../../shared/entities";

export const _api = remultSveltekit({
  admin: true,
  entities: entities,
});

export const { GET, POST, PUT, DELETE } = _api;

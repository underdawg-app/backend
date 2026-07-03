import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
  RouteShorthandOptions,
} from 'fastify';

/**
 * A route handler whose request generic (`Body`/`Params`/`Querystring`/...) is
 * inferred directly from its own signature.
 */
type TypedHandler<R extends RouteGenericInterface> = (
  req: FastifyRequest<R>,
  reply: FastifyReply,
) => Promise<void> | void;

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Thin typed wrapper around the Fastify instance's route shorthands.
 *
 * Why this exists: Fastify's built-in `app.post(path, opts, handler)` wraps the
 * handler's request type in `ResolveFastifyRequestType`, which prevents
 * TypeScript from *inferring* the route generic from a pre-typed controller
 * method — especially once `opts.preHandler` is present (it pins the generic to
 * `RouteGenericInterface`, erasing the handler's `Body`/`Params`/`Querystring`
 * types and producing spurious "unknown is not assignable" errors).
 *
 * This helper takes the handler as `(req: FastifyRequest<R>, ...)` *directly*,
 * so `R` is inferred from the controller method's own annotations. Runtime
 * validation is unaffected — it still comes from the global zod
 * `validatorCompiler` set in `app.ts` via the `schema` passed in `opts`.
 */
export function typedRouter(app: FastifyInstance) {
  const make =
    (method: Method) =>
    <R extends RouteGenericInterface>(
      path: string,
      opts: RouteShorthandOptions,
      handler: TypedHandler<R>,
    ): void => {
      // The cast bridges our inferred handler to Fastify's wrapped type; the
      // public signature above keeps full type-safety at every call site.
      (app[method] as (p: string, o: RouteShorthandOptions, h: unknown) => void)(
        path,
        opts,
        handler,
      );
    };

  return {
    get: make('get'),
    post: make('post'),
    put: make('put'),
    patch: make('patch'),
    delete: make('delete'),
  };
}

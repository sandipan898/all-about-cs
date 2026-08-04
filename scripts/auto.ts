/**
 * `auto` — the universal, chatbot-agnostic entrypoint for AACS automation.
 *
 * Every task is reachable through ONE stable contract so any surface — this
 * editor's agent, another chatbot emitting a shell command, a GitHub Action, a
 * cron-jobs.org HTTP trigger relayed to `workflow_dispatch`, or plain `curl` —
 * invokes the exact same logic:
 *
 *   npm run auto -- <task> [--flags]
 *
 * Tasks:
 *   validate                 Validate all tutorial content (blocking gate).
 *   next-topic [--topic=..]  Resolve the next tutorial to write.
 *              [--pillar=..]
 *   report                   Build the weekly digest (opens an issue in CI).
 *   social  [--slug=..]      Generate per-platform promo drafts.
 *   usage   [--enforce]      Check GitHub Actions minutes; alert/gate on budget.
 *   help                     Show this list.
 */
import { runValidate } from "./validate-content";
import { runNextTopic } from "./next-topic";
import { runCurriculum } from "./curriculum";
import { runReport } from "./report";
import { runSeoSignals } from "./seo-signals";
import { runSocial } from "./social";
import { runUsageGuard } from "./usage-guard";
import { generateJwtForCli } from "./lib/gsc";
import { log } from "./lib/log";

const HELP = `
AACS automation — usage: npm run auto -- <task> [--flags]

  validate                     Validate tutorial content (frontmatter, links, video guard)
  next-topic [--topic="..."]   Resolve the next topic (explicit > series > curriculum)
             [--pillar=dsa]     --by=opportunity ranks gaps by baked-in SEO score
             [--by=opportunity]
  curriculum [--prompt]        Audit the curriculum vs files; --prompt emits an AI
             [--apply <file>]  research brief; --apply merges an AI-produced curriculum
  seo-signals [--cwv-only]     Fetch GSC + CWV (PSI), write seo-signals.json, alert on regressions
  gsc-jwt                      Print a signed GSC JWT to stdout — paste into Postman gsc_jwt variable
  report                       Build weekly digest (upserts an issue in CI)
  social     [--slug=<slug>]   Generate per-platform social drafts
  usage      [--enforce]       Check Actions minutes; alert/gate before overage
  help                         Show this help
`;

async function main(): Promise<number> {
  const [task, ...rest] = process.argv.slice(2);
  switch ((task ?? "help").toLowerCase()) {
    case "validate":
      return runValidate();
    case "next-topic":
    case "next":
      return runNextTopic(rest);
    case "curriculum":
      return runCurriculum(rest);
    case "seo-signals":
    case "seo":
      return runSeoSignals(rest);
    case "gsc-jwt": {
      try {
        const jwt = generateJwtForCli();
        log.info("\nPaste this JWT into the Postman collection variable  gsc_jwt\n");
        log.info("(Valid for 1 hour — regenerate when it expires)\n");
        process.stdout.write(jwt + "\n");
        return 0;
      } catch (err) {
        log.error(`gsc-jwt: ${(err as Error).message}`);
        return 1;
      }
    }
    case "report":
    case "digest":
      return runReport();
    case "social":
      return runSocial(rest);
    case "usage":
    case "usage-check":
      return runUsageGuard(rest);
    case "help":
    case "--help":
    case "-h":
      log.info(HELP);
      return 0;
    default:
      log.error(`Unknown task: "${task}"`);
      log.info(HELP);
      return 2;
  }
}

main().then((code) => process.exit(code));

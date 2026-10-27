import * as acorn from "acorn";
import type { Finding } from "./review-types";
type Node = any;
type Scope = { names: Set<string>; parent?: Scope; functionScope: boolean };
// Two passes make hoisted declarations and lexical shadowing independent of order.
export function inspectJavaScript(
  source: string,
  file: string,
  check: (ref: string) => void,
): Finding[] {
  const tree = acorn.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
    allowReturnOutsideFunction: true,
    locations: true,
  });
  const scopes = new WeakMap<object, Scope>();
  const nodes: Node[] = [];
  const bind = (n: Node, scope: Scope) => {
    if (!n) return;
    if (n.type === "Identifier") scope.names.add(n.name);
    else if (n.type === "RestElement") bind(n.argument, scope);
    else if (n.type === "AssignmentPattern") bind(n.left, scope);
    else if (n.type === "ArrayPattern")
      n.elements.forEach((x: Node) => bind(x, scope));
    else if (n.type === "ObjectPattern")
      n.properties.forEach((x: Node) => bind(x.value ?? x.argument, scope));
  };
  const visit = (n: Node, parent: Scope) => {
    if (!n || typeof n.type !== "string") return;
    if (["FunctionDeclaration", "ClassDeclaration"].includes(n.type))
      bind(n.id, parent);
    let scope = parent;
    const fn =
      /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(
        n.type,
      );
    if (
      fn ||
      [
        "BlockStatement",
        "CatchClause",
        "ForStatement",
        "ForOfStatement",
        "ForInStatement",
      ].includes(n.type)
    )
      scope = { names: new Set(), parent, functionScope: fn };
    if (fn) {
      bind(n.id, scope);
      n.params.forEach((p: Node) => bind(p, scope));
    }
    if (n.type === "CatchClause") bind(n.param, scope);
    if (n.type === "VariableDeclaration") {
      let target = scope;
      if (n.kind === "var")
        while (target.parent && !target.functionScope) target = target.parent;
      n.declarations.forEach((d: Node) => bind(d.id, target));
    }
    if (n.type === "ImportDeclaration")
      n.specifiers.forEach((s: Node) => bind(s.local, scope));
    scopes.set(n, scope);
    nodes.push(n);
    for (const [key, value] of Object.entries(n)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((v) => visit(v, scope));
      else if (value && typeof value === "object") visit(value, scope);
    }
  };
  visit(tree, { names: new Set(), functionScope: true });
  const shadowed = (name: string, scope?: Scope): boolean =>
    !!scope && (scope.names.has(name) || shadowed(name, scope.parent));
  const globalPath = (n: Node, scope: Scope): string | undefined => {
    if (!n) return;
    if (n.type === "Identifier")
      return shadowed(n.name, scope) ? undefined : n.name;
    if (n.type === "MemberExpression") {
      const base = globalPath(n.object, scope);
      const prop = n.computed
        ? n.property.type === "Literal"
          ? n.property.value
          : undefined
        : n.property.name;
      if (base && typeof prop === "string") return base + "." + prop;
    }
  };
  const findings: Finding[] = [];
  const add = (
    n: Node,
    rule: string,
    message: string,
    severity: Finding["severity"] = "blocker",
  ) =>
    findings.push({
      rule,
      severity,
      group: severity === "warning" ? "coverage" : "code",
      file,
      location: `${n.loc.start.line}:${n.loc.start.column + 1}`,
      evidence: source.slice(n.start, Math.min(n.end, n.start + 240)),
      message,
      remedy:
        severity === "warning"
          ? "Davranışı güvenli önizlemede inceleyin."
          : "Sabit göreli kaynaklar ve yerel işlevler kullanarak bu işlemi kaldırın.",
    });
  for (const n of nodes) {
    const scope = scopes.get(n)!;
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(n.type) &&
      n.source
    )
      check(n.source.value);
    if (n.type === "ImportExpression") {
      if (n.source.type !== "Literal" || typeof n.source.value !== "string")
        add(
          n,
          "code.dynamic-import",
          "Dinamik import sabit göreli dosya belirtmeli.",
        );
      else check(n.source.value);
    }
    if (["CallExpression", "NewExpression"].includes(n.type)) {
      const raw = globalPath(n.callee, scope);
      const name = raw?.replace(/^(?:window|globalThis|self)\./, "");
      if (name === "fetch") {
        if (
          n.arguments[0]?.type !== "Literal" ||
          typeof n.arguments[0].value !== "string"
        )
          add(n, "code.dynamic-fetch", "fetch sabit göreli dosya belirtmeli.");
        else check(n.arguments[0].value);
      }
      if (["eval", "Function"].includes(name ?? ""))
        add(
          n,
          "code.dynamic-execution",
          "Dinamik kod çalıştırma desteklenmiyor.",
        );
      if (["setTimeout", "setInterval"].includes(name ?? "")) {
        const arg = n.arguments[0];
        if (
          (arg?.type === "Literal" && typeof arg.value === "string") ||
          arg?.type === "TemplateLiteral"
        )
          add(n, "code.string-timer", "Zamanlayıcıya kod metni verilemez.");
        else if (
          arg &&
          ![
            "FunctionExpression",
            "ArrowFunctionExpression",
            "Identifier",
          ].includes(arg.type)
        )
          add(
            n,
            "coverage.timer",
            "Zamanlayıcının çağıracağı işlev statik olarak doğrulanamadı.",
            "warning",
          );
      }
      if (
        [
          "open",
          "importScripts",
          "WebSocket",
          "EventSource",
          "Worker",
          "SharedWorker",
          "XMLHttpRequest",
          "navigator.sendBeacon",
          "navigator.serviceWorker.register",
          "location.assign",
          "location.replace",
          "top.location.assign",
          "top.location.replace",
        ].includes(name ?? "")
      )
        add(
          n,
          "code.unsupported-api",
          `Desteklenmeyen ağ, yönlendirme veya worker işlemi: ${name}`,
        );
    }
    if (n.type === "AssignmentExpression") {
      const name = globalPath(n.left, scope)?.replace(
        /^(?:window|globalThis|self)\./,
        "",
      );
      if (/^(?:(?:top|parent)\.)?location(?:\.href)?$/.test(name ?? ""))
        add(
          n,
          "code.navigation",
          "Programatik sayfa yönlendirmesi desteklenmiyor.",
        );
    }
  }
  return findings;
}

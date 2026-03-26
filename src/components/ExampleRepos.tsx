"use client";

const EXAMPLE_REPOS = [
  { name: "tobybro/Claude-catcher", desc: "This project" },
  { name: "shadcn-ui/ui", desc: "Component library" },
  { name: "vercel/next.js", desc: "React framework" },
];

export function ExampleRepos() {
  function fillInput(repoName: string) {
    const input = document.querySelector<HTMLInputElement>('input[type="url"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, `https://github.com/${repoName}`);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
      <span>Try:</span>
      {EXAMPLE_REPOS.map((repo) => (
        <button
          key={repo.name}
          onClick={() => fillInput(repo.name)}
          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-mono"
        >
          {repo.name}
        </button>
      ))}
    </div>
  );
}

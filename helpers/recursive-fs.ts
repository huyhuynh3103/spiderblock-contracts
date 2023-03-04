import fs from "fs";

async function read(
  dpath: string
): Promise<{ dirs: string[]; files: string[] }> {
  const dirs: string[] = [];
  const files: string[] = [];
  dirs.push(dpath);

  async function walk(_dirs: string[]) {
    if (!_dirs.length) return { dirs, files };

    const __dirs: string[] = [];

    for (const dir of _dirs) {
      try {
        const _files = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of _files) {
          const fpath = `${dir}/${entry.name}`;
          if (entry.isDirectory()) {
            __dirs.push(fpath);
            dirs.push(fpath);
          } else {
            files.push(fpath);
          }
        }

        await walk(__dirs);
      } catch (err: any) {
        throw new Error(err.message);
      }
    }
    return { dirs, files };
  }

  try {
    return await walk([dpath]);
  } catch (err: any) {
    throw new Error(err.message);
  }
}
export { read };

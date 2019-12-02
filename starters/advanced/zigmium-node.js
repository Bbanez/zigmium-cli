const path = require('path');
const fs = require('fs-extra');
const { FSUtil } = require('zigmium/util/fs-util.js');
const { MDHelper } = require("zigmium/util/md-helper.js");

exports.modifyPage = async page => {
  if (page.name === "/page-2") {
    page.setJsVar(
      "__pageInfo__",
      "This text was injected by zigmium-node.js file."
    );
  }
};

exports.modifyTemplate = async page => {
  const templates = [];
  switch (page.name) {
    case "/blog":
      {
        const fileTree = await FSUtil.fileTree(
          path.join(process.env.PROJECT_ROOT, "/src/templates/blog/markdown")
        );
        for (const i in fileTree) {
          const file = fileTree[i];
          const md = await MDHelper.toObject(
            `/src/templates/blog/markdown/${file.name}`
          );
          md.content = MDHelper.parseContent(md.content);
          templates.push({
            path: `/blog/${file.name.replace(".md", "")}`,
            var: [
              {
                key: "__markdown__",
                value: JSON.stringify(md)
              }
            ]
          });
        }
      }
      break;
  }
  return templates;
};

exports.finalize = async pages => {
  try {
    await fs.remove(path.join(process.env.PROJECT_ROOT, '/public'));
  } catch (error) {
    console.log('No public folder.');
  }
  try {
    await fs.copy(
      path.join(process.env.PROJECT_ROOT, '/static'),
      path.join(process.env.PROJECT_ROOT, '/public'),
    );
  } catch (error) {
    console.log('No static folder.');
  }
  for (const i in pages) {
    const page = pages[i];
    await FSUtil.save(page.html.src, `/public/${page.location.path}`);
  }
};

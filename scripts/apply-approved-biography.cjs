const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/app-settings.tsx"
);

let source = fs.readFileSync(filePath, "utf8");

const biographyPattern =
  /(<Text style=\{styles\.biographyText\}>)[\s\S]*?(<\/Text>)/m;

if (!biographyPattern.test(source)) {
  throw new Error(
    "Could not find the Biography text block in app-settings.tsx."
  );
}

const approvedBiography = `$1
            I am a self-taught developer with
            a genuine passion for programming,
            technology, and creating useful
            digital solutions. I enjoy learning
            through hands-on projects,
            experimenting with new ideas, and
            continuously improving my skills as
            I build applications from the ground
            up.

            My focus is on developing practical
            apps that can help solve real
            problems, simplify everyday tasks,
            and make important processes easier
            to manage. I am especially interested
            in creating applications that can be
            useful to local communities,
            organizations, and people who can
            benefit from simple and accessible
            technology.

            I believe that programming is not
            only about writing code, but also
            about understanding problems and
            finding better ways to solve them.
            Every project I work on is an
            opportunity for me to learn something
            new, improve my approach, and
            challenge myself to build applications
            that are reliable, organized, and
            meaningful.

            As a self-taught developer, I continue
            to grow through curiosity, persistence,
            and constant practice. My goal is to
            keep learning, build more useful
            applications, and use technology to
            create solutions that can have a
            positive impact on people and
            communities.
          $2`;

source = source.replace(
  biographyPattern,
  approvedBiography
);

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log("Approved biography added to App Settings.");
console.log("");
console.log("Run: npx tsc --noEmit");

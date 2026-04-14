const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');

try {
    const files = fs.readdirSync(servicesDir);
    for (const file of files) {
        if (file.endsWith('.ts')) {
            const filePath = path.join(servicesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            if (!content.includes('"use server"') && !content.includes("'use server'")) {
                fs.writeFileSync(filePath, '"use server";\n\n' + content);
                console.log(`Added 'use server' to ${file}`);
            }
        }
    }
} catch (e) {
    console.error(e);
}

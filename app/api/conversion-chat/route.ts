import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Function to read all formula files and create an indexed knowledge base
// Don't use caching to ensure we always get the latest file content
function readFormulaIndex(): Map<
  string,
  { content: string; keywords: string[] }
> {
  const formulaMap = new Map<string, { content: string; keywords: string[] }>();
  const formulasDir = path.join(process.cwd(), "formulas");

  try {
    const files = fs.readdirSync(formulasDir);

    for (const file of files) {
      if (file.endsWith(".txt")) {
        const filePath = path.join(formulasDir, file);
        // Read fresh content every time without caching
        const content = fs.readFileSync(filePath, "utf8");

        // Define keywords for each file type
        let keywords: string[] = [];
        if (file === "length.txt") {
          keywords = [
            "length",
            "meter",
            "kilometer",
            "mile",
            "foot",
            "feet",
            "inch",
            "yards",
            "cm",
            "mm",
            "km",
            "distance",
          ];
        } else if (file === "temperature.txt") {
          keywords = [
            "temperature",
            "celsius",
            "fahrenheit",
            "kelvin",
            "degree",
            "hot",
            "cold",
            "°c",
            "°f",
            "heat",
          ];
        } else if (file === "mass.txt") {
          keywords = [
            "mass",
            "weight",
            "kilogram",
            "gram",
            "pound",
            "ounce",
            "ton",
            "kg",
            "g",
            "lb",
            "heavy",
          ];
        } else if (file === "area.txt") {
          keywords = [
            "area",
            "square",
            "acres",
            "hectare",
            "km²",
            "m²",
            "ft²",
            "square feet",
            "square meters",
            "land",
            "surface",
          ];
        } else if (file === "volume.txt") {
          keywords = [
            "volume",
            "liter",
            "gallon",
            "quart",
            "pint",
            "cup",
            "fluid",
            "cubic",
            "l",
            "ml",
            "m³",
            "cm³",
            "mm³",
            "capacity",
          ];
        } else if (file === "time.txt") {
          keywords = [
            "time",
            "second",
            "minute",
            "hour",
            "day",
            "week",
            "month",
            "year",
            "millisecond",
            "microsecond",
            "nanosecond",
            "duration",
          ];
        } else if (file === "speed.txt") {
          keywords = [
            "speed",
            "velocity",
            "mph",
            "kph",
            "km/h",
            "m/s",
            "knot",
            "mach",
            "fast",
            "slow",
            "per hour",
            "per second",
          ];
        } else if (file === "data.txt") {
          keywords = [
            "data",
            "byte",
            "bit",
            "kilobyte",
            "megabyte",
            "gigabyte",
            "terabyte",
            "petabyte",
            "storage",
            "memory",
            "kb",
            "mb",
            "gb",
            "tb",
          ];
        }

        formulaMap.set(file, { content, keywords });
      }
    }

    return formulaMap;
  } catch (error) {
    console.error("Error creating formula index:", error);
    return new Map();
  }
}

// Function to find the most relevant sections from the formulas based on the query
function retrieveRelevantFormulas(query: string): string {
  const formulaIndex = readFormulaIndex();
  const lowerQuery = query.toLowerCase();

  // First, find which formula file is most relevant
  let bestMatchFile = "";
  let highestMatchCount = 0;

  for (const [file, { keywords }] of formulaIndex.entries()) {
    const matchCount = keywords.filter((keyword) =>
      lowerQuery.includes(keyword),
    ).length;
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestMatchFile = file;
    }
  }

  if (!bestMatchFile) {
    return "";
  }

  // Get the full formula content
  const { content } = formulaIndex.get(bestMatchFile) || { content: "" };

  // Extract specific units mentioned in the query for more targeted retrieval
  const unitMentions = extractUnitsFromQuery(lowerQuery, bestMatchFile);

  // If specific units are mentioned, find the relevant sections of the formula
  if (unitMentions.length > 0) {
    const contentLines = content.split("\n");
    const relevantContent: string[] = [];

    // Always include the title and general formula sections
    const titleSection = contentLines.slice(0, 5).join("\n");
    relevantContent.push(titleSection);

    // Find the general formula section (usually in the middle of the file)
    const generalFormulaIndex = contentLines.findIndex((line) =>
      line.includes("General Formula"),
    );
    if (generalFormulaIndex !== -1) {
      const generalFormulaSection = contentLines
        .slice(generalFormulaIndex, generalFormulaIndex + 6)
        .join("\n");
      relevantContent.push(generalFormulaSection);
    }

    // Extract conversion factors for mentioned units
    for (const unit of unitMentions) {
      const unitPattern = new RegExp(unit, "i");
      for (let i = 0; i < contentLines.length; i++) {
        if (unitPattern.test(contentLines[i])) {
          // Include this line in the relevant content
          relevantContent.push(contentLines[i]);
        }
      }
    }

    // Also include any example section
    const exampleIndex = contentLines.findIndex((line) =>
      line.includes("Example"),
    );
    if (exampleIndex !== -1) {
      const exampleSection = contentLines
        .slice(exampleIndex, exampleIndex + 5)
        .join("\n");
      relevantContent.push(exampleSection);
    }

    // Return the targeted sections
    return [...new Set(relevantContent)].join("\n");
  }

  // If no specific units are mentioned, return the whole formula
  return content;
}

// Helper function to extract unit names from a query based on the formula type
function extractUnitsFromQuery(query: string, formulaType: string): string[] {
  let unitPatterns: string[] = [];

  if (formulaType === "length.txt") {
    unitPatterns = [
      "kilometer",
      "meter",
      "centimeter",
      "millimeter",
      "mile",
      "foot",
      "feet",
      "inch",
      "yard",
      "parsec",
      "light year",
      "nautical mile",
    ];
  } else if (formulaType === "temperature.txt") {
    unitPatterns = ["celsius", "fahrenheit", "kelvin", "rankine", "reaumur"];
  } else if (formulaType === "mass.txt") {
    unitPatterns = [
      "kilogram",
      "gram",
      "pound",
      "ounce",
      "ton",
      "tonne",
      "stone",
      "carat",
    ];
  } else if (formulaType === "area.txt") {
    unitPatterns = [
      "square kilometer",
      "square meter",
      "square mile",
      "acre",
      "hectare",
      "ha",
      "km²",
      "m²",
      "ft²",
      "square feet",
      "square inch",
    ];
  } else if (formulaType === "volume.txt") {
    unitPatterns = [
      "cubic meter",
      "cubic kilometer",
      "cubic centimeter",
      "cubic millimeter",
      "liter",
      "milliliter",
      "gallon",
      "quart",
      "pint",
      "cup",
      "fluid ounce",
      "tablespoon",
      "teaspoon",
      "cubic inch",
      "cubic foot",
      "cubic yard",
    ];
  } else if (formulaType === "time.txt") {
    unitPatterns = [
      "year",
      "month",
      "week",
      "day",
      "hour",
      "minute",
      "second",
      "millisecond",
      "microsecond",
      "nanosecond",
      "picosecond",
    ];
  } else if (formulaType === "speed.txt") {
    unitPatterns = [
      "meter per second",
      "kilometer per hour",
      "mile per hour",
      "feet per second",
      "knot",
      "mach",
      "m/s",
      "km/h",
      "mph",
      "ft/s",
    ];
  } else if (formulaType === "data.txt") {
    unitPatterns = [
      "bit",
      "byte",
      "kilobyte",
      "kibibyte",
      "megabyte",
      "mebibyte",
      "gigabyte",
      "gibibyte",
      "terabyte",
      "tebibyte",
      "petabyte",
      "pebibyte",
      "exabyte",
      "exbibyte",
      "zettabyte",
      "zebibyte",
      "yottabyte",
      "yobibyte",
    ];
  }

  return unitPatterns.filter((unit) => query.toLowerCase().includes(unit));
}

// Helper to detect if a query is calculation-related
function isCalculationQuery(query: string): boolean {
  const calculationKeywords = [
    "calculate",
    "convert",
    "formula",
    "equation",
    "math",
    "solve",
    "computation",
    "calculator",
    "unit",
    "measure",
    "value",
    "equals",
    "how many",
    "how much",
    "equal to",
    "equals",
  ];

  // Check if input contains any of the keywords
  const hasKeyword = calculationKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword),
  );

  // Check if input contains a number (for handling conversion values like "5" or "10 km")
  const hasNumber = /[0-9]/.test(query);

  // Check if this is a follow-up to a conversion query (just a number)
  const isJustNumber = /^[0-9]+(\.[0-9]+)?$/.test(query.trim());

  return hasKeyword || hasNumber || isJustNumber;
}

// Function to detect file conversion query
function isFileConversionQuery(query: string, fileInfo?: any): boolean {
  if (fileInfo) return true;

  const conversionKeywords = [
    "convert file",
    "file conversion",
    "convert image",
    "convert video",
    "convert audio",
    "convert document",
    "transform file",
    "file format",
    "change format",
    "mp4",
    "mp3",
    "jpg",
    "png",
    "pdf",
    "docx",
    "xlsx",
    "convert to",
    "format to",
    "file to",
  ];

  return conversionKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword),
  );
}

// Helper function to better detect file extensions and types
function getFileInfo(fileName: string, fileType: string) {
  const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  const baseName = fileName.substring(0, fileName.lastIndexOf("."));
  
  // Determine file category based on MIME type or extension
  let fileCategory = 'unknown';
  
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'].includes(extension)) {
    fileCategory = 'image';
  } else if (fileType.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(extension)) {
    fileCategory = 'video';
  } else if (fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
    fileCategory = 'audio';
  } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension) || fileType.includes('document')) {
    fileCategory = 'document';
  } else if (['xls', 'xlsx', 'csv', 'ods'].includes(extension) || fileType.includes('spreadsheet')) {
    fileCategory = 'spreadsheet';
  } else if (['ppt', 'pptx', 'odp'].includes(extension) || fileType.includes('presentation')) {
    fileCategory = 'presentation';
  } else if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    fileCategory = 'archive';
  } else if (['blend', 'obj', 'fbx', 'stl', '3ds', 'dae', 'glb', 'gltf'].includes(extension)) {
    fileCategory = '3d';
  }
  
  return {
    extension,
    baseName,
    fileCategory
  };
}

// Generate recommendations or links for special file types
function getSpecialFileTypeRecommendation(fileCategory: string, extension: string): string | null {
  // Archive files (zip, rar, 7z, etc.)
  if (fileCategory === 'archive') {
    return `## Recommendation for Archive Files (.${extension})

This is an archive file that requires a dedicated extraction tool. Instead of conversion, I recommend using 7-Zip:

1. Download 7-Zip from the official website:
\`\`\`
https://www.7-zip.org/download.html
\`\`\`

2. Install 7-Zip following the instructions.

3. Right-click on your ${extension} file and select "7-Zip" > "Extract Here" or "Extract to [folder]" to unpack the contents.

7-Zip is a free, open-source file archiver that can handle ${extension} files and almost all archive formats.`;
  }
  
  // 3D model files
  else if (fileCategory === '3d') {
    return `## Recommendation for 3D Files (.${extension})

This is a 3D model file that requires specialized software. I recommend using Blender:

1. Download Blender from the official website:
\`\`\`
https://www.blender.org/download/
\`\`\`

2. Install Blender following the instructions.

3. Open Blender, then go to File > Import > Select the appropriate format (${extension.toUpperCase()})

4. Navigate to your file and import it.

5. To export to a different format, go to File > Export > Select your desired format.

Blender is a free, open-source 3D creation suite that supports a wide range of 3D file formats.`;
  }
  
  // Office documents (Word, Excel, PowerPoint)
  else if (fileCategory === 'document' || fileCategory === 'spreadsheet' || fileCategory === 'presentation') {
    return `## Recommendation for Office Files (.${extension})

This is an office document that can be opened and converted with LibreOffice:

1. Download LibreOffice from the official website:
\`\`\`
https://www.libreoffice.org/download/download/
\`\`\`

2. Install LibreOffice following the instructions.

3. Open your ${extension} file with LibreOffice.

4. To convert to another format, go to File > Save As and select your desired format.

LibreOffice is a free, open-source office suite that can handle Microsoft Office formats and many others.`;
  }
  
  return null;
}

// Helper function to better detect file formats and generate appropriate conversion commands
function generateFileConversionCommands(fileName: string, fileType: string, targetFormat?: string): string {
  // Extract file info
  const { extension, baseName, fileCategory } = getFileInfo(fileName, fileType);
  const folderName = `${baseName}_conversion`;
  
  // Validate conversion possibility and get suitable output format
  const outputFormat = getValidOutputFormat(extension, targetFormat, fileCategory);
  
  // If conversion is not possible, return an explanation
  if (!outputFormat) {
    const recommendation = getSpecialFileTypeRecommendation(fileCategory, extension);
    if (recommendation) {
      return recommendation;
    }
    return `Converting ${fileName} is not supported. This file type (${extension}) cannot be reliably converted using standard tools. Please try with a different file format.`;
  }

  // Build conversion steps with code blocks for ALL steps to ensure proper parsing
  let commands = `# Converting ${fileName} to ${outputFormat} format\n\n`;
  
  // Step 1: Create folder with actual command
  commands += `1. Create a folder for conversion: \`\`\`\nmkdir "${folderName}"\`\`\`\n\n`;
  
  // Step 2: Move file with actual command
  commands += `2. Move/Copy the file: \`\`\`\ncopy "${fileName}" "${folderName}\\"\`\`\`\n\n`;
  
  // Step 3: Navigate to folder with actual command
  commands += `3. Go to the folder: \`\`\`\ncd "${folderName}"\`\`\`\n\n`;
  
  // Step 4: Install packages based on file category
  const pythonPackages = getPythonPackagesForConversion(fileCategory, extension, outputFormat);
  commands += `4. Install required Python packages: \`\`\`\n${pythonPackages}\`\`\`\n\n`;
  
  // Step 5: Get one-line Python command instead of creating a script
  const pythonOneLineCommand = getPythonOneLineCommand(fileName, extension, outputFormat, fileCategory);
  commands += `5. Run the direct conversion command: \`\`\`\n${pythonOneLineCommand}\`\`\`\n\n`;
  
  // Final note
  commands += `Your converted file will be saved as "${baseName}_converted.${outputFormat}" in the folder.`;
  
  return commands;
}

// Helper function to determine valid output format
function getValidOutputFormat(extension: string, targetFormat: string | undefined, fileCategory: string): string | null {
  // If target format is specified, validate it works with the input format
  if (targetFormat) {
    // Prevent converting to the same format
    if (extension.toLowerCase() === targetFormat.toLowerCase()) {
      return null;
    }
    
    // Check if the conversion is possible/valid
    const impossibleConversions = [
      // Format pairs that can't be reliably converted between
      { from: 'exe', to: 'any' },
      { from: 'dll', to: 'any' },
      { from: 'sys', to: 'any' },
      { from: 'bin', to: 'any' },
      { from: 'dat', to: 'any' },
      { from: 'db', to: 'any' },
      // Add more impossible conversions as needed
    ];
    
    // Check if this is in the impossible list
    for (const pair of impossibleConversions) {
      if (
        (pair.from === extension || pair.from === 'any') && 
        (pair.to === targetFormat || pair.to === 'any')
      ) {
        return null;
      }
    }
    
    return targetFormat;
  }
  
  // If no target format specified, suggest a default based on the file category
  switch (fileCategory) {
    case 'image':
      return extension === 'png' ? 'jpg' : 'png';
    case 'video':
      return extension === 'mp4' ? 'mkv' : 'mp4';
    case 'audio':
      return extension === 'mp3' ? 'wav' : 'mp3';
    case 'document':
      return extension === 'pdf' ? 'docx' : 'pdf';
    case 'spreadsheet':
      return extension === 'csv' ? 'xlsx' : 'csv';
    default:
      // If we can't determine a good format, return null to indicate conversion isn't supported
      return null;
  }
}

// Helper function to get required Python packages
function getPythonPackagesForConversion(fileCategory: string, inputFormat: string, outputFormat: string): string {
  switch (fileCategory) {
    case 'image':
      return 'pip install pillow';
    case 'video':
      return 'pip install moviepy';
    case 'audio':
      return 'pip install pydub';
    case 'document':
      if (inputFormat === 'pdf' && outputFormat === 'docx') {
        return 'pip install pdf2docx';
      } else if ((inputFormat === 'docx' || inputFormat === 'doc') && outputFormat === 'pdf') {
        return 'pip install docx2pdf';
      } else {
        return 'pip install python-docx pdf2docx PyPDF2 docx2pdf';
      }
    case 'spreadsheet':
      return 'pip install pandas openpyxl';
    default:
      return '# Unable to determine required packages for this file type';
  }
}

// Helper function to get Python conversion code
function getPythonConversionCode(
  fileName: string, 
  inputFormat: string, 
  outputFormat: string, 
  fileCategory: string
): string {
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  
  switch (fileCategory) {
    case 'image':
      return `from PIL import Image

# Open the image file
img = Image.open("${fileName}")

# Convert and save to new format
img.save("${baseName}_converted.${outputFormat}")

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;

    case 'video':
      return `from moviepy.editor import VideoFileClip

# Load the video file
clip = VideoFileClip("${fileName}")

# Convert and save to new format
clip.write_videofile("${baseName}_converted.${outputFormat}")

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;

    case 'audio':
      return `from pydub import AudioSegment

# Load the audio file
audio = AudioSegment.from_file("${fileName}", format="${inputFormat}")

# Convert and save to new format
audio.export("${baseName}_converted.${outputFormat}", format="${outputFormat}")

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;

    case 'document':
      if (inputFormat === 'pdf' && outputFormat === 'docx') {
        return `from pdf2docx import Converter

# Convert PDF to DOCX
cv = Converter("${fileName}")
cv.convert("${baseName}_converted.${outputFormat}")
cv.close()

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;
      } else if ((inputFormat === 'docx' || inputFormat === 'doc') && outputFormat === 'pdf') {
        return `from docx2pdf import convert

# Convert DOCX to PDF
convert("${fileName}", "${baseName}_converted.${outputFormat}")

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;
      } else {
        return `# This specific document conversion (${inputFormat} to ${outputFormat}) requires more specialized handling
import os

# Check which conversion method to use based on file extensions
if os.path.exists("${fileName}"):
    print(f"File ${fileName} found, ready for conversion to ${outputFormat}")
    print(f"Please install the appropriate conversion library for this specific format")
else:
    print(f"File not found: ${fileName}")`;
      }

    case 'spreadsheet':
      if (inputFormat === 'csv' && outputFormat === 'xlsx') {
        return `import pandas as pd

# Load CSV data
data = pd.read_csv("${fileName}")

# Save as Excel
data.to_excel("${baseName}_converted.${outputFormat}", index=False)

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;
      } else if (inputFormat === 'xlsx' && outputFormat === 'csv') {
        return `import pandas as pd

# Load Excel data
data = pd.read_excel("${fileName}")

# Save as CSV
data.to_csv("${baseName}_converted.${outputFormat}", index=False)

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;
      } else {
        return `import pandas as pd

# Load data (format will be detected based on extension)
data = pd.read_excel("${fileName}") if "${inputFormat}" in ["xlsx", "xls"] else pd.read_csv("${fileName}")

# Save in new format
if "${outputFormat}" in ["xlsx", "xls"]:
    data.to_excel("${baseName}_converted.${outputFormat}", index=False)
else:
    data.to_csv("${baseName}_converted.${outputFormat}", index=False)

print(f"Converted ${fileName} to ${baseName}_converted.${outputFormat}")`;
      }

    default:
      return `# Unable to generate conversion code for this specific file type
print(f"Unable to convert ${fileName} to ${outputFormat}")
print("This file type requires specialized conversion tools.")`;
  }
}

// Helper function to get direct Python command (one-liner) for conversion
function getPythonOneLineCommand(
  fileName: string, 
  inputFormat: string, 
  outputFormat: string, 
  fileCategory: string
): string {
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  
  switch (fileCategory) {
    case 'image':
      return `python -c "from PIL import Image; img = Image.open('${fileName}'); img.save('${baseName}_converted.${outputFormat}'); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      
    case 'video':
      return `python -c "from moviepy.editor import VideoFileClip; clip = VideoFileClip('${fileName}'); clip.write_videofile('${baseName}_converted.${outputFormat}'); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      
    case 'audio':
      return `python -c "from pydub import AudioSegment; audio = AudioSegment.from_file('${fileName}', format='${inputFormat}'); audio.export('${baseName}_converted.${outputFormat}', format='${outputFormat}'); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      
    case 'document':
      if (inputFormat === 'pdf' && outputFormat === 'docx') {
        return `python -c "from pdf2docx import Converter; cv = Converter('${fileName}'); cv.convert('${baseName}_converted.${outputFormat}'); cv.close(); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      } else if ((inputFormat === 'docx' || inputFormat === 'doc') && outputFormat === 'pdf') {
        return `python -c "from docx2pdf import convert; convert('${fileName}', '${baseName}_converted.${outputFormat}'); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      } else {
        return `python -c "import os; print(f'File {os.path.exists(\\"${fileName}\\")} found, ready for conversion to ${outputFormat}'); print('Please use the appropriate conversion library for this specific format')"`;
      }
      
    case 'spreadsheet':
      if (inputFormat === 'csv' && outputFormat === 'xlsx') {
        return `python -c "import pandas as pd; data = pd.read_csv('${fileName}'); data.to_excel('${baseName}_converted.${outputFormat}', index=False); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      } else if (inputFormat === 'xlsx' && outputFormat === 'csv') {
        return `python -c "import pandas as pd; data = pd.read_excel('${fileName}'); data.to_csv('${baseName}_converted.${outputFormat}', index=False); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      } else {
        return `python -c "import pandas as pd; data = pd.read_excel('${fileName}') if '${inputFormat}' in ['xlsx', 'xls'] else pd.read_csv('${fileName}'); data.to_excel('${baseName}_converted.${outputFormat}', index=False) if '${outputFormat}' in ['xlsx', 'xls'] else data.to_csv('${baseName}_converted.${outputFormat}', index=False); print(f'Converted ${fileName} to ${baseName}_converted.${outputFormat}')"`;
      }
      
    default:
      return `python -c "print(f'Unable to convert ${fileName} to ${outputFormat}'); print('This file type requires specialized conversion tools.')"`;
  }
}

// Function to detect which AI provider to use based on API key format
function detectAIProvider(apiKey: string): "openai" | "gemini" {
  // OpenAI API keys usually start with 'sk-'
  if (apiKey.startsWith("sk-")) {
    return "openai";
  }

  // Default to Gemini (Google AI) for keys that don't match other patterns
  // Google API keys typically start with 'AIza'
  return "gemini";
}

// Generate content using the appropriate AI provider
async function generateAIResponse(
  provider: string,
  apiKey: string,
  prompt: string,
): Promise<string> {
  try {
    switch (provider) {
      case "openai":
        const openai = new OpenAI({ apiKey });
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content:
                "You are a specialized calculation assistant that helps with calculations and unit conversions.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        });
        return (
          openaiResponse.choices[0]?.message?.content ||
          "No response from OpenAI"
        );

      case "gemini":
      default:
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            temperature: 0.3,
          },
        });
        try {
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (error) {
          // If 2.0-flash model fails, try with the standard model
          console.warn(
            "Gemini Pro request failed, falling back to standard Gemini:",
            error,
          );
          const fallbackModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
              temperature: 0.3,
            },
          });
          const fallbackResult = await fallbackModel.generateContent(prompt);
          return fallbackResult.response.text();
        }
    }
  } catch (error) {
    console.error(`Error with ${provider} API:`, error);
    throw new Error(
      `Failed to generate response with ${provider}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { message, apiKey, conversionContext, fileInfo } = body;

    if (!message || !apiKey) {
      return NextResponse.json(
        { error: "Missing message or API key" },
        { status: 400 },
      );
    }

    // Handle file conversion request
    if (fileInfo || isFileConversionQuery(message)) {
      if (fileInfo) {
        // Generate file conversion commands based on the file info
        const fileName = fileInfo.name;
        const fileType = fileInfo.type;
        const targetFormat = fileInfo.targetFormat || "";
        
        // Get file info to determine if it's a special case
        const { fileCategory, extension } = getFileInfo(fileName, fileType);
        
        // Handle special file types first (archives, 3D files, office documents)
        if (['archive', '3d'].includes(fileCategory)) {
          const specialRecommendation = getSpecialFileTypeRecommendation(fileCategory, extension);
          if (specialRecommendation) {
            return NextResponse.json({ response: specialRecommendation });
          }
        }
        
        // For unknown or unsupported file types, return a clear message
        if (fileCategory === 'unknown') {
          return NextResponse.json({ 
            response: `# Unsupported File Format
            
This file format (.${extension}) is not supported for conversion. I can only provide conversion commands for:

- Images (jpg, png, gif, webp, etc.)
- Videos (mp4, avi, mov, mkv, etc.)
- Audio (mp3, wav, ogg, flac, etc.)
- Documents (pdf, docx, txt, etc.)
- Spreadsheets (csv, xlsx, etc.)

For archives like ZIP or RAR files, I recommend using 7-Zip.
For 3D files, I recommend using Blender.
For Office documents, I recommend using LibreOffice.`
          });
        }

        // Either use basic commands or ask AI for more specific ones depending on complexity
        const basicCommands = generateFileConversionCommands(fileName, fileType, targetFormat);

        // For simple conversions, just use the basic commands
        if (fileInfo.size < 10000000) {
          // Less than 10MB, use basic commands
          return NextResponse.json({ response: basicCommands });
        } else {
          // For larger files, ask AI for more optimized conversion strategies
          const prompt = `
            You are a specialized file conversion assistant that provides commands to convert files.
            
            The user has uploaded a file with the following information:
            Filename: ${fileName}
            File type: ${fileType}
            File size: ${fileInfo.size} bytes
            ${targetFormat ? `Target format: ${targetFormat}` : ''}
            
            Please provide detailed terminal commands to:
            1. Create a folder for the conversion
            2. Move the file to that folder
            3. Navigate to that folder
            4. Install any necessary Python packages for conversion
            5. Create a Python script to convert the file ${targetFormat ? `to ${targetFormat} format` : 'to an appropriate format'}
            6. Run the conversion script
            
            Here's a basic command set that you can improve upon or optimize:
            
            ${basicCommands}
            
            Please optimize these commands if needed based on the file type and size.
            Format the commands clearly with code blocks for easy copying.
          `;

          // Detect which AI provider to use based on the API key format
          const provider = detectAIProvider(apiKey);
          const aiResponse = await generateAIResponse(provider, apiKey, prompt);
          return NextResponse.json({ response: aiResponse });
        }
      } else {
        // User asked about file conversion but didn't provide a file
        const prompt = `
          You are a specialized file conversion assistant.
          
          The user is asking about file conversion: "${message}"
          
          Provide information about how they can use this chat interface to drag and drop files for conversion,
          and explain what file types are supported. Mention that they can receive terminal commands 
          and Python scripts to perform the conversion locally, as this is not an online conversion tool.
        `;

        const provider = detectAIProvider(apiKey);
        const aiResponse = await generateAIResponse(provider, apiKey, prompt);
        return NextResponse.json({ response: aiResponse });
      }
    }

    // Check if message is just a number (likely a value to convert)
    const isJustNumber = /^[0-9]+(\.[0-9]+)?$/.test(message.trim());

    // If the message is just a number or contains a number, treat it as a calculation query
    const isValueInput = isJustNumber || /[0-9]/.test(message);

    // Using RAG to retrieve relevant formula information
    let relevantFormula = retrieveRelevantFormulas(message);

    // If we have conversion context, use it to get the appropriate formula
    if (conversionContext) {
      // Get formulas based on the conversion category
      const formulaFiles = {
        Length: "length.txt",
        Temperature: "temperature.txt",
        "Mass/Weight": "mass.txt",
        Area: "area.txt",
        Volume: "volume.txt",
        Speed: "speed.txt",
        Time: "time.txt",
        "Data Storage": "data.txt",
      };

      // Normalize the category name for case-insensitive matching
      const normalizedCategory = conversionContext.category?.trim() || "";
      let formulaFile: string | undefined;
      if (normalizedCategory in formulaFiles) {
        formulaFile =
          formulaFiles[normalizedCategory as keyof typeof formulaFiles];
      }

      // If we don't have an exact match, try case-insensitive matching
      if (!formulaFile) {
        const categoryLower = normalizedCategory.toLowerCase();
        const matchedCategory = Object.keys(formulaFiles).find(
          (key) => key.toLowerCase() === categoryLower,
        );
        if (matchedCategory) {
          formulaFile =
            formulaFiles[matchedCategory as keyof typeof formulaFiles];
        } else {
          // Fallback to a basic match based on keywords
          if (
            categoryLower.includes("length") ||
            categoryLower.includes("distance")
          ) {
            formulaFile = "length.txt";
          } else if (categoryLower.includes("temp")) {
            formulaFile = "temperature.txt";
          } else if (
            categoryLower.includes("mass") ||
            categoryLower.includes("weight")
          ) {
            formulaFile = "mass.txt";
          } else if (categoryLower.includes("area")) {
            formulaFile = "area.txt";
          } else if (categoryLower.includes("volume")) {
            formulaFile = "volume.txt";
          } else if (categoryLower.includes("speed")) {
            formulaFile = "speed.txt";
          } else if (categoryLower.includes("time")) {
            formulaFile = "time.txt";
          } else if (
            categoryLower.includes("data") ||
            categoryLower.includes("storage")
          ) {
            formulaFile = "data.txt";
          }
        }
      }

      if (formulaFile) {
        try {
          const formulasDir = path.join(process.cwd(), "formulas");
          const filePath = path.join(formulasDir, formulaFile);
          if (fs.existsSync(filePath)) {
            relevantFormula = fs.readFileSync(filePath, "utf8");
          } else {
            console.warn(
              `Formula file ${formulaFile} does not exist at path: ${filePath}`,
            );
          }
        } catch (error) {
          console.error("Error reading formula file:", error);
        }
      } else {
        console.warn(
          `No matching formula file found for category: ${conversionContext.category}`,
        );
      }
    }

    // Check if the query is calculation-related - consider pure numbers as calculation queries
    const isCalcQuery =
      isCalculationQuery(message) ||
      relevantFormula ||
      isValueInput ||
      !!conversionContext;

    // Detect which AI provider to use based on the API key format
    const provider = detectAIProvider(apiKey);

    // Prepare the prompt based on whether we have a relevant formula
    let prompt = "";

    if (!isCalcQuery) {
      // If not calculation related, instruct the model to decline answering
      prompt = `
        You are a specialized calculation assistant that ONLY answers questions about calculations and unit conversions.
        
        The user's query is: "${message}"
        
        This query doesn't appear to be related to calculations or unit conversions. Politely decline to answer and explain that you can only assist with calculations and unit conversions.
      `;
    } else if (conversionContext) {
      // Handle case where we have unit context and the user is entering a value
      prompt = `
        You are a specialized calculation assistant that helps with calculations and unit conversions.
        
        The user has selected the following conversion:
        From: ${conversionContext.from}
        To: ${conversionContext.to}
        Category: ${conversionContext.category}
        
        The user's input value is: "${message}"
        
        ${
          relevantFormula
            ? `Here is the formula information to help with this conversion:
        
        ${relevantFormula}
        
        IMPORTANT: You MUST use the EXACT conversion factors provided above, even if they differ from what you believe to be correct.`
            : ""
        }
        
        Please perform the conversion of ${message} ${conversionContext.from} to ${conversionContext.to}.
        Include the formula used and a step-by-step calculation.
        Clearly state the final result.
      `;
    } else if (isJustNumber) {
      // Handle case where user just inputs a number (but without explicit conversion context)
      prompt = `
        You are a specialized calculation assistant that helps with calculations and unit conversions.
        
        The user has provided only a numeric value: ${message}
        
        ${
          relevantFormula
            ? `Here is the formula information that might be relevant:
        
        ${relevantFormula}`
            : ""
        }
        
        Since the user has only provided a number, ask what units they would like to convert from and to.
        Suggest some common conversions that might be applicable for this value.
      `;
    } else {
      // Regular calculation query with formula context
      prompt = `
        You are a specialized calculation assistant that helps with calculations and unit conversions.
        
        The user's query is: "${message}"
        
        ${
          relevantFormula
            ? `Here is the EXACT and CURRENT formula information to help answer this query. You MUST use ONLY these conversion rates and formulas, NOT any other values you might know:
        
        ${relevantFormula}
        
        IMPORTANT: You MUST use the EXACT conversion factors provided above, even if they differ from what you believe to be correct. For example, if the formula says 1 hectare = 90,000 square meters, you must use this value in your calculations, NOT the standard 10,000 square meters value.
        
        Using ONLY the formula information above, provide a concise, accurate answer to the user's query.`
            : "This appears to be a calculation-related query. Provide a concise, accurate answer."
        }
        
        Your response should be:
        1. Focused only on the calculation or conversion requested
        2. Concise and to the point
        3. Include the formula used (if applicable)
        4. Show the step-by-step calculation using ONLY the conversion factors provided
        5. Clearly state the final result
      `;
    }

    // Generate response using the appropriate AI provider
    const response = await generateAIResponse(provider, apiKey, prompt);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in calculations chat API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
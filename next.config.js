/** Make sure the Excel file is bundled with the serverless function on Vercel */
module.exports = {
  outputFileTracingIncludes: { '/api/notify': ['./data/**'] },
};

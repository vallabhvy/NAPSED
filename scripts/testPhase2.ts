import { getChallengesByTrack, getChallengeBySlug } from "../src/services/challengeService";
import { createSubmission } from "../src/services/submissionService";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Testing Challenge Service ===");
  const challenges = await getChallengesByTrack("BACKEND");
  console.log(`Found ${challenges.length} backend challenges.`);
  
  if (challenges.length === 0) {
    console.error("No backend challenges found. Seed failed?");
    return;
  }

  const slug = challenges[0].slug;
  const challenge = await getChallengeBySlug(slug);
  console.log(`Fetched challenge '${challenge.title}' with ${challenge.defensePrompts.length} prompts.`);
  
  if ('solutionCode' in challenge) {
    console.error("SECURITY RISK: solutionCode was leaked!");
  } else {
    console.log("Success: solutionCode was properly excluded.");
  }

  console.log("\n=== Testing Submission Service ===");
  
  const systemUser = await prisma.user.findUnique({ where: { username: 'devproof-system' } });
  if (!systemUser) throw new Error("System user not found");

  const promptId = challenge.defensePrompts[0].id;
  
  // Test 1: Too short
  try {
    await createSubmission(systemUser.id, challenge.id, "-- code", "lua", {
      [promptId]: "Too short"
    });
    console.error("FAILED: Did not reject short answer");
  } catch (e: any) {
    console.log("Passed: Rejected short answer (" + e.message + ")");
  }

  // Test 2: Passed with soft warning for keywords
  try {
    const sub = await createSubmission(systemUser.id, challenge.id, "-- code", "lua", {
      [promptId]: "This is a sufficiently long answer but it does not contain any architectural keywords so it should just soft warn."
    });
    console.log(`Passed: Created submission ${sub.id} with status ${sub.status}`);
  } catch (e: any) {
    console.error("FAILED: Rejected valid answer (" + e.message + ")");
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

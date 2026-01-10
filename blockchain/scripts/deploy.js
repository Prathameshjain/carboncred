const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CarbonCred Token (CCT) to Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  // Deploy CarbonCredToken contract
  const CarbonCredToken = await hre.ethers.getContractFactory("CarbonCredToken");
  const contract = await CarbonCredToken.deploy();

  // Wait for deployment (ethers v5 syntax)
  await contract.deployed();

  const contractAddress = contract.address;
  console.log(`✅ CarbonCredToken deployed to: ${contractAddress}`);

  // Authorize backend wallet if provided
  const BACKEND_WALLET = process.env.BACKEND_WALLET_ADDRESS;
  if (BACKEND_WALLET) {
    console.log(`Authorizing backend wallet: ${BACKEND_WALLET}`);
    const tx = await contract.authorizeBackend(BACKEND_WALLET);
    await tx.wait();
    console.log("💎 Backend wallet authorized!");
  }

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("1. Copy the contract address to your Django .env file:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Run 'npx hardhat compile' to generate ABI");
  console.log("3. Copy ABI from artifacts/contracts/CarbonCredToken.sol/CarbonCredToken.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

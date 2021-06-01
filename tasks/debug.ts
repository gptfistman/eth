// these tasks are intended to simplify the debugging and development workflow by essentially giving
// you god-mode status, allowing you to change the state of the world however you want.

import { task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DarkForestTokens } from '../task-types';

// see DarkForestTypes.sol - ArtifactType
const artifactOptions = (
  'Monolith,Colossus,Spaceship,Pyramid,Wormhole,' +
  'PlanetaryShield,PhotoidCannon,BloomFilter,BlackDomain'
).split(',');

// yarn workspace eth hardhat:dev debug:giveArtifact "0x27fd6eec1e1f3ce4a53b40d5813119d868f7b4e3" PhotoidCannon 5
task('debug:giveArtifact', 'gives the player some amount of a particular type of artifact')
  .addPositionalParam(
    'playerAddress',
    'the address of the player to give the artifacts',
    undefined,
    types.string
  )
  .addPositionalParam(
    'artifactType',
    'one of: [Monolith, Colossus, Spaceship, Pyramid, Wormhole, ' +
      'PlanetaryShield, PhotoidCannon, BloomFilter, BlackDomain]',
    undefined,
    types.string
  )
  .addPositionalParam('amount', 'the amount of this artifact to give', 1, types.int)
  .addPositionalParam('rarity', 'the rarity of the artifact to give', 1, types.int)
  .addPositionalParam('biome', 'the biome of the artifact to give', 1, types.int)
  .setAction(giveArtifact);

async function giveArtifact(
  {
    playerAddress,
    artifactType,
    amount,
    rarity,
    biome,
  }: { playerAddress: string; artifactType: string; amount: number; rarity: number; biome: number },
  hre: HardhatRuntimeEnvironment
) {
  const chosenArtifactType = artifactOptions.indexOf(artifactType) + 1;
  const tokens: DarkForestTokens = await hre.run('utils:getTokens');

  for (let i = 0; i < amount; i++) {
    // see DarkForestTypes.sol - DFTCreateArtifactArgs
    const createArtifactArgs = {
      tokenId: random256Id(),
      discoverer: playerAddress,
      planetId: '0',
      rarity: rarity,
      biome: biome,
      artifactType: chosenArtifactType,
      owner: playerAddress,
    };

    await (await tokens.createArtifact(createArtifactArgs)).wait();
  }
}

task('debug:specialSetAdmin', 'set admin to 0x5D...').setAction(specialSetAdmin);

async function specialSetAdmin({}, hre: HardhatRuntimeEnvironment) {
  const tokens: DarkForestTokens = await hre.run('utils:getTokens');

  await (await tokens.specialSetAdmin()).wait();
}

// yarn workspace eth hardhat:dev debug:giveOneOfEachArtifact "0x5bcf0ac4c057dcaf9b23e4dd7cb7b035a71dd0dc" 10
task(
  'debug:giveOneOfEachArtifact',
  'gives the player one of each type of artifact, one of each rarity'
)
  .addPositionalParam(
    'playerAddress',
    'the address of the player to give the artifacts',
    undefined,
    types.string
  )
  .addPositionalParam('biome', 'the biome of the artifacts to give', 1, types.int)
  .setAction(giveOneOfEachArtifact);

async function giveOneOfEachArtifact(
  { playerAddress, biome }: { playerAddress: string; biome: number },
  hre: HardhatRuntimeEnvironment
) {
  for (const artifact of artifactOptions) {
    for (let i = 1; i < 6; i++) {
      await giveArtifact(
        { playerAddress, artifactType: artifact, amount: 1, rarity: i, biome },
        hre
      );
    }
  }
}

function random256Id() {
  const alphabet = '0123456789ABCDEF'.split('');
  let result = '0x';
  for (let i = 0; i < 256 / 4; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}
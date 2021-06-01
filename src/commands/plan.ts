import {Command, flags} from '@oclif/command'
import * as inquirer from 'inquirer';
import * as yaml from 'js-yaml';
import * as Joi from 'joi';
import * as fs from 'fs';
import * as path from 'path';
import { CloudFormation, CloudFormationClient, CreateChangeSetCommand, CreateChangeSetCommandInput, CreateChangeSetCommandOutput, DescribeChangeSetCommand, DescribeChangeSetCommandInput, DescribeChangeSetCommandOutput, Parameter } from '@aws-sdk/client-cloudformation';

const cfnClient = new CloudFormationClient({});
const cloudformation = new AWS.CloudFormation();

interface CfnctlConfig {
  stack: string;
  template_file: string;
  parameter_overrides: object;
  tags: object
}

const cfnctlConfigSchema = Joi.array().items(
  Joi.object({
    stack: Joi.string().required(),
    template_file: Joi.string().required(),
    parameter_overrides: Joi.object().unknown(true),
    tags: Joi.object().unknown(true)
  })
)

function configListStacks(config: [CfnctlConfig]) {
  return () => {
    return config.map(c => c.stack);
    return ['foo', 'bar'];
  }
}

async function createChangeSet(params: CreateChangeSetCommandInput): Promise<CreateChangeSetCommandOutput> {
  let response;
  const retryableRegex = /^Stack.+does not exist/

  const createChangeSetCmd = new CreateChangeSetCommand(params);

  try {
    response = await cfnClient.send(createChangeSetCmd) as CreateChangeSetCommandOutput
  } catch (e) {
    if (retryableRegex.test(e.message)) {
      // If the stack set didn't already exist; Update the change set type to
      // create and try again.
      // We could do a check to see if the stack exists before attempting to
      // create the change set, but then that would need to happen every time
      // and most of the time, this request will be happening for stacks that
      // already exist.
      params.ChangeSetType = 'CREATE';
      return createChangeSet(params);
    }

    throw e;
  }

  return response;
}

async function describeChangeSet(params: DescribeChangeSetCommandInput): Promise<DescribeChangeSetCommandOutput> {
  // let response: DescribeChangeSetCommandOutput;

  const describeChangeSetCmd = new DescribeChangeSetCommand(params);

  return await cfnClient.send(describeChangeSetCmd)
}

/**
 * Custom type guard for [CfnctlConfig]
 * Validates that the object parameter is of type [CfnctlConfig] and returns a
 * boolean; If this function returns true, it will tell Typescript that the
 * input object is of type [CfnctlConfig] as defined by the predicate:
 * `obj is [CfnctlConfig]`
 * https://rangle.io/blog/how-to-use-typescript-type-guards/
 * @param {any} obj - The object to check for type [CfnctlConfig]
 * @returns {boolean} Boolean - True if object is of type [CfnctlConfig]
 */
function isCfnctlConfig(obj: any): obj is [CfnctlConfig] {
  const { error } = cfnctlConfigSchema.validate(obj);
  return !error;
}

async function readConfig(configFile: string): Promise<[CfnctlConfig]> {
  let config: [CfnctlConfig];

  const parsedConfig = yaml.load(fs.readFileSync(configFile, 'utf8'));

  if (!isCfnctlConfig(parsedConfig)) {
    // Run validation again so we can return useful errors to the user
    try {
      await cfnctlConfigSchema.validateAsync(parsedConfig, {abortEarly: false})
    } catch (e) {
      throw new Error(`Cfnctl config invalid: ${e.message}`);
    }

    // This should never actually happen, but TS doesn't like
    throw new Error('Unknown error validating cfnctl config')
  }

  config = parsedConfig;
  return config;
}

export default class Plan extends Command {
  static description = 'create a change set and display the changes'

  static flags = {
    help: flags.help({char: 'h'}),
    // config file to use
    file: flags.string({
      char: 'f',
      description: 'Name of the cfnctl config file (Default is "./.cfnctl.yaml")',
      env: 'CFNCTL_FILE',
      default: './.cfnctl.yaml'
    }),
  }

  static args = [{
      name: 'stack',
      description: 'The stack to use from your cfnctl configuration',
  }]

  async run() {
    let config: [CfnctlConfig];
    const {args, flags} = this.parse(Plan)
    let { stack } = args;
    let { file: configFile } = flags;

    try {
      config = await readConfig(configFile);
    } catch (e) {
      this.error(`Failed to read and parse cfnctl config file.\n  ${e.message}`, {exit: 1});
    }

    // Prompt for missing required values
    let responses: any = await inquirer.prompt([
      {
        name: 'stack',
        message: 'Select your stack:',
        type: 'list',
        choices: configListStacks(config),
        when: !stack
      }
    ])

    stack = stack || responses.stack;

    let stackConfig = config.find(c => c.stack === stack);
    if (!stackConfig) {
      this.error(`The stack name "${stack}" is not available in your cfnctl config.`);
    }

    const templateBody = fs.readFileSync(path.join(
      path.dirname(configFile),
      stackConfig.template_file
    ), 'utf8');

    let parameterOverrides: Parameter[] = [];
    Object.entries(stackConfig.parameter_overrides).forEach(([key, val]) => {
      parameterOverrides.push({ParameterKey: key, ParameterValue: val});
    })

    console.log('Stack:', stack);
    console.log('STACK CONFIG:', stackConfig);


    // const client = new CloudFormationClient({});
    const csParams: CreateChangeSetCommandInput = {
      StackName: stackConfig.stack,
      ChangeSetName: 'test',
      // ChangeSetType: 'CREATE',
      TemplateBody: templateBody,
      Parameters: parameterOverrides,
    }
    // console.log('CS PARAMS:', csParams)
    // const createStackCommand = new CreateChangeSetCommand(csParams);
    // createStackCommand.input()
    const { Id: changeSetName, StackId: stackName } = await createChangeSet(csParams);
    // console.log('CS OUTPUT:', csOutput);

    await CloudFormation.waitFor()

    const describeCsParams: DescribeChangeSetCommandInput = {
      ChangeSetName: changeSetName,
      StackName: stackName
    }

    const dcsOutput = await describeChangeSet(describeCsParams);
    console.log('DCS OUTPUT:', dcsOutput);
  }
}

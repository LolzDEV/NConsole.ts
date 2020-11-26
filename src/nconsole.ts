import readlineSync = require("readline-sync");

import fs = require('fs')

export class Command{

    command: string
    help_message: string  
    aliases: Array<string>  
    subcommands: Array<string>  
    args_accepted: Array<string>  
    vars_to_save: Object
    vars: Object
	// Initialize a command
	constructor(command: string, help_message: string, aliases: Array<string>, subcommands?: Array<string>, args_accepted?: Array<string>){
        this.command = command
        this.help_message = help_message
        this.aliases = aliases
        this.subcommands = subcommands
        this.args_accepted = args_accepted
    }
	// vars_to_save must be a dict with key as name, and value as your var
	public set_vars_to_save(vars_to_save: any): void {
        this.vars_to_save = vars_to_save
    }
	
	// Called by CommandsRegister, don't override
	public save_all(): void{
        if (this.vars_to_save != null){  // If there are vars to be saved
            fs.writeFile(`${this.command}.json`, JSON.stringify(this.vars_to_save), err =>{
                if(err) return console.log(err)
            })
        }
    }
	
	// Get data from file and save it to the right variables
	public get_savings(): void{
		if (this.vars_to_save != null){
            fs.readFile(`${this.command}.json`, (err, data) => {
                if (err) throw err;
                let json_data = JSON.parse(data.toString());
                for (const [key, value] of Object.entries(json_data)) {
                    this.vars[key] = value
                }
            });
        }
    }
	// You have to override this, here you handle your commands
	// ATTENTION: the first statement has to be args = args[0] or else it will be bugged
	public on_command(args?: string[]): void{
        console.error("on_command method is not overrided")
    }
}


export class CommandsRegister{

	commands: Command[] = []

	// You have to pass your own command class that handles a command
	public register_command(command: Command){
        this.commands.push(command)
    }

	// Return a Command from a command name, not alias
	public get_command_from_command_name(command_name: string){
		this.commands.forEach(command => {
            if (command_name == command.command) return command
        })
    }
	// Calls save_all() of all commands registered
	public save_all(){
		this.commands.forEach(command => {
            command.save_all()
        })
    }
	
	// Calls get_savings() of all commands registered
	public get_savings(){
        this.commands.forEach(command => {
            command.get_savings()
        })
    }

	// Called by Console, it handles input and calls on_command() of the right class
	public check_input(input_check: string){
		input_check = input_check.toLowerCase()  // Console is insesitive case
		let input_check_splitted = input_check.split(" ")  // Split commands from other arguments
		let command_name = input_check_splitted[0]  // This is the command you have typed
		let args = input_check_splitted.slice(1)  // These are other arguments
		let error_command = 0  // Useful to check if a command is valid
		let max_error = 0  // Same as above
		this.commands.forEach(command => {
            if (command.aliases == null || command.aliases.length < 1){  // Check wether a command has aliases
				max_error += 1
				if (command_name == command.command){  // If you have typed a command
					if(args.length < 1){  // and you didn't pass arguments
                        command.on_command()  // triggers on_command of the right class without arguments
                    } else{  // and you passed arguments
                        command.on_command(args)  // triggers on_command of the right class with those arguments
                    }
                }
            } else {  // If command has aliases
				command.aliases.forEach(alias => {  // Iterate over all of those aliases
                    max_error += 1
					if (command_name == command.command || command_name == alias){  // Check wether you typed a command or an aliases
						if (args.length < 1){  // if you didn't pass arguments
                            command.on_command()  // triggers on_command of the right class without arguments
                        } else{  // and you passed arguments
                            command.on_command(args)  // triggers on_command of the right class with those arguments
                        }
                    } else {
                        error_command += 1
                    }
                }) 
					
            }
        })
		if (error_command == max_error) console.log(`\033[91m[ERROR] ${command_name} is an invalid command`)  // if you haven't typed a command (or alias) report user that that command (or alias) is inexistent
    }
}

// Various type of log
export enum ConsoleLogType{
	INFO = 1,  // INFO = normal output
	WARN = 2,  // WARN = something that has not to happen, but isn't fatal
    ERROR = 3  // ERROR = the name explains itself
}

export class Console{

    input_prefix: string
    commands_register: CommandsRegister

	// Initialize the console passing the input_prefix and the CommandsRegister
	constructor(input_prefix: string, commands_register: CommandsRegister){
		this.input_prefix = input_prefix
        this.commands_register = commands_register
    }
    
	// Update itself, you have to call it in a while True:
	public async update(){

        this.commands_register.check_input(readlineSync.question(this.input_prefix))
    }

	// Use this instead of print()
	public log(type_log: ConsoleLogType, ...args: any[]){
		let message: string
        // Check the message type
        switch(type_log){
            case 1:
                message = "\x1b[32m[INFO]"  
                break
            case 2:
                message = "\x1b[33m[WARNING]"
                break
            case 3:
                message = "\x1b[31m[ERROR]"
                break
        }
        args.forEach(arg => {
            message = `${message} ${arg}\x1b[0m`
        })
        console.log(message)
    }
}
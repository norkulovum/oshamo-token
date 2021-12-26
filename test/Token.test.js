import { EVM_REVERT, tokens } from './helpers'

const { default: Web3 } = require('web3');

const Token = artifacts.require('./Token');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Token', ([deployer, reciever, exchange]) =>{   //you can put accounts to take an array of them like this account
    const name = 'OxShamo Token' 
    const symbol = 'OxShamo'
    const decimals = '18'
    const totalSupply = tokens(1000000).toString()
    let token 
    
    beforeEach(async () =>{
        token = await Token.new()
    })

    describe('deployement', () => {

        it('tracks the name', async () =>{
            const result = await token.name()
            result.should.equal(name)
        })

        it('tracks the symbol', async () =>{
            const result = await token.symbol()
            result.should.equal(symbol)
        })
        
        it('tracks the decimals', async () =>{
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })

        it('tracks the total sypply', async () =>{
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })

        it('assigns the total supply to the deployer', async () =>{
            const result = await token.balanceOf(deployer) //specify the account index array or indv accounts[0]
            result.toString().should.equal(totalSupply.toString())
        })

    })

    describe('sending tokens',() =>{
        let  amount, result
        
        describe('success', async () =>{
            beforeEach(async () =>{
                amount = tokens(100)
                result = await token.transfer(reciever, amount, {from: deployer})
            })
    
            it('transfers token balances', async () =>{
                let balanceOf
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                balanceOf = await token.balanceOf(reciever)
                balanceOf.toString().should.equal(tokens(100).toString())
            })
    
            it('emits a Transfer event', async () =>{
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.eq(deployer, 'from address is correct')
                event.to.toString().should.eq(reciever, 'to address is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () =>{

            it('rejects insufficient balances', async () =>{
                let invalidAmount

                invalidAmount = tokens(100000000)
                await token.transfer(reciever, invalidAmount, {from:deployer}).should.be.rejectedWith(EVM_REVERT)
           
                invalidAmount = tokens(10)
                await token.transfer(deployer, invalidAmount, {from:reciever}).should.be.rejectedWith(EVM_REVERT)
            })

            it('rejects invalid recipient', async () =>{
                await token.transfer(0x0, amount, {from:deployer}).should.be.rejected
            })
        })
    })

    describe('approving tokens', () => {
        let result, amount
      
        beforeEach(async () =>{
            amount = tokens(100)
            result = await token.approve(exchange, amount, {from: deployer})
        })
      
        describe('success', async () =>{

            it('allocates an alowance for delegated token sending on exchange',async () =>{
                const allowance= await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString())
            })

            it('emits an Approval event', async () =>{
                const log = result.logs[0]
                log.event.should.eq('Approval')
                const event = log.args
                event.owner.toString().should.eq(deployer, 'owner is correct')
                event.spender.toString().should.eq(exchange, 'to address is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () =>{

            it('rejects invalid Spender', async () =>{
                await token.approve(0x0, amount, {from:deployer}).should.be.rejected
            })

        })
    })

    describe('delegated token transfers',() =>{
        let  amount, result
        
        beforeEach( async () =>{
            amount = tokens(100)
            await token.approve(exchange, amount, {from: deployer})
        })

        describe('success', async () =>{
            beforeEach(async () =>{
                result = await token.transferFrom(deployer, reciever, amount, {from: exchange})
            })
    
            it('transfers token balances', async () =>{
                let balanceOf
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                balanceOf = await token.balanceOf(reciever)
                balanceOf.toString().should.equal(tokens(100).toString())
            })

            it('resets the alowance',async () =>{
                const allowance= await token.allowance(deployer, exchange)
                allowance.toString().should.equal('0')
            })

            it('emits a Transfer event', async () =>{
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.eq(deployer, 'from address is correct')
                event.to.toString().should.eq(reciever, 'to address is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () =>{

            it('rejects insufficient balances', async () =>{
                const invalidAmount = tokens(100000000)
                await token.transferFrom(deployer, reciever, invalidAmount, {from:exchange}).should.be.rejectedWith(EVM_REVERT)
            })

            it('rejects invalid recipient', async () =>{
                await token.transfer(deployer, 0x0, amount, {from:exchange}).should.be.rejected
            })
        })
    })
    

})
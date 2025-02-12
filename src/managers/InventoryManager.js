const Emitter = require('../classes/Emitter')
const EconomyError = require('../classes/EconomyError')

const FetchManager = require('./FetchManager')
const DatabaseManager = require('./DatabaseManager')
const BalanceManager = require('./BalanceManager')

const errors = require('../structures/errors')

/**
 * Inventory manager methods class.
 * @extends {Emitter}
 */
class InventoryManager extends Emitter {

    /**
      * Economy constructor options object. 
      * There's only needed options object properties for this manager to work properly.
      * @param {Object} options Constructor options object.
      * @param {String} options.storagePath Full path to a JSON file. Default: './storage.json'.
      * @param {String} options.dateLocale The region (example: 'ru' or 'en') to format date and time. Default: 'en'.
      * @param {Boolean} options.subtractOnBuy 
      * If true, when someone buys the item, their balance will subtract by item price.
     */
    constructor(options = {}) {
        super()

        /**
         * Economy constructor options object.
         * @private
         * @type {?EconomyOptions}
         */
        this.options = options

        /**
         * Database manager methods object.
         * @type {DatabaseManager}
         * @private
         */
        this.database = new DatabaseManager(options)

        /**
         * Balance manager methods object.
         * @type {BalanceManager}
         * @private
         */
        this.balance = new BalanceManager(options)
    }

    /**
     * Clears the user's inventory.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If cleared: true, else: false.
     */
    clear(memberID, guildID) {
        const inventory = this.fetch(memberID, guildID)

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!inventory) return false

        return this.database.remove(`${guildID}.${memberID}.inventory`)
    }

    /**
     * Searches for the item in the inventory.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {InventoryData} If item not found: null; else: item info object.
     */
    searchItem(itemID, memberID, guildID) {

        /**
        * @type {InventoryData[]}
        */
        const inventory = this.fetch(memberID, guildID)
        const item = inventory.find(x => x.id == itemID || x.itemName == itemID)

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null
        return item
    }

    /**
     * Shows all items in user's inventory.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {InventoryData[]} User's inventory array.
     */
    fetch(memberID, guildID) {
        const inventory = this.database.fetch(`${guildID}.${memberID}.inventory`) || []

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        return inventory
    }

    /**
     * Uses the item from user's inventory.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {Client} [client] The Discord Client. [Optional]
     * @returns {String | boolean} Item message or null if item not found.
     */
    useItem(itemID, memberID, guildID, client) {

        /**
         * @type {InventoryData[]}
         */
        const inventory = this.fetch(memberID, guildID)

        const itemObject = this.searchItem(itemID, memberID, guildID)
        const itemIndex = inventory.findIndex(x => x.id == itemObject?.id)

        const item = inventory[itemIndex]

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }
        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null

        if (item.role) {
            if (item.role && !client) {
                throw new EconomyError(errors.noClient)
            }

            const guild = client.guilds.cache.get(guildID)
            const roleID = item.role.replace('<@&', '').replace('>', '')

            guild.roles.fetch(roleID).then(role => {
                const member = guild.members.cache.get(memberID)

                member.roles.add(role).catch(err => {
                    if (!role) {
                        return console.error(new EconomyError(errors.roleNotFound + roleID))
                    }

                    console.error(
                        `\x1b[31mFailed to give a role "${guild.roles.cache.get(roleID)?.name}"` +
                        `on guild "${guild.name}" to member ${guild.member(memberID).user.tag}:\x1b[36m`
                    )

                    console.error(err)
                    console.error('\x1b[0m')
                })
            })
        }

        this.removeItem(itemID, memberID, guildID)
        this.emit('shopItemUse', item)

        return item.message
    }

    /**
     * Removes the item from user's inventory.
     * @param {String | Number} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If removed successfully: true, else: false.
     */
    removeItem(itemID, memberID, guildID) {

        /**
        * @type {InventoryData[]}
        */
        const inventory = this.fetch(memberID, guildID)

        const item = this.searchItem(itemID, memberID, guildID)
        const itemIndex = inventory.findIndex(x => x.id == item?.id)

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }
        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return false

        return this.database
            .removeElement(`${guildID}.${memberID}.inventory`, itemIndex)
    }

    /**
     * Removes the item from user's inventory
     * and adds its price to the user' balance.
     * This is the same as selling something.
     * @param {String | Number} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {Number} The price the item was sold for.
     */
    sellItem(itemID, memberID, guildID, reason = 'sold the item from the inventory') {
        const item = this.searchItem(itemID, memberID, guildID)

        const percent = this.options.sellingItemPercent
        const sellingPrice = Math.floor((item?.price / 100) * percent)

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }
        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null

        this.balance
            .add(sellingPrice, memberID, guildID, reason)

        this.removeItem(itemID, memberID, guildID)
        return sellingPrice
    }
}

/**
 * @typedef {Object} AddItemOptions Options object with item info for 'Economy.shop.addItem' method.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} [message='You have used this item!'] Item message that will be returned on use.
 * @property {String} [description='Very mysterious item.'] Item description.
 * @property {Number} [maxAmount=null] Max amount of the item that user can hold in his inventory.
 * @property {String} [role=null] Role ID from your Discord server.
 * @returns {ItemData} Item info.
 */

/**
 * History data object.
 * @typedef {Object} HistoryData
 * @property {Number} id Item ID in history.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} role ID of Discord Role that will be given to user on item use.
 * @property {String} date Date when the item was bought.
 * @property {String} memberID Member ID.
 * @property {String} guildID Guild ID.
 */

/**
 * Item data object.
 * @typedef {Object} ItemData
 * @property {Number} id Item ID.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} description Item description.
 * @property {String} role ID of Discord Role that will be given to Wuser on item use.
 * @property {Number} maxAmount Max amount of the item that user can hold in his inventory.
 * @property {String} date Date when the item was added in the shop.
 */

/**
 * Inventory data object.
 * @typedef {Object} InventoryData
 * @property {Number} id Item ID in your inventory.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} role ID of Discord Role that will be given to user on item use.
 * @property {Number} maxAmount Max amount of the item that user can hold in his inventory.
 * @property {String} date Date when the item was bought.
 */

/**
 * @typedef {Object} EconomyOptions Default Economy options object.
 * @property {String} [storagePath='./storage.json'] Full path to a JSON file. Default: './storage.json'
 * @property {Boolean} [checkStorage=true] Checks the if database file exists and if it has errors. Default: true
 * @property {Number} [dailyCooldown=86400000] 
 * Cooldown for Daily Command (in ms). Default: 24 Hours (60000 * 60 * 24) ms
 * 
 * @property {Number} [workCooldown=3600000] Cooldown for Work Command (in ms). Default: 1 Hour (60000 * 60) ms
 * @property {Number | Number[]} [dailyAmount=100] Amount of money for Daily Command. Default: 100.
 * @property {Number} [weeklyCooldown=604800000] 
 * Cooldown for Weekly Command (in ms). Default: 7 Days (60000 * 60 * 24 * 7) ms
 *
 * @property {Number} [sellingItemPercent=75]
 * Percent of the item's price it will be sold for. Default: 75.
 * 
 * @property {Boolean} deprecationWarnings 
 * If true, the deprecation warnings will be sent in the console.
 * @property {Number | Number[]} [weeklyAmount=100] Amount of money for Weekly Command. Default: 1000.
 * @property {Number | Number[]} [workAmount=[10, 50]] Amount of money for Work Command. Default: [10, 50].
 * @property {Boolean} [subtractOnBuy=true] 
 * If true, when someone buys the item, their balance will subtract by item price. Default: false
 * 
 * @property {Number} [updateCountdown=1000] Checks for if storage file exists in specified time (in ms). Default: 1000.
 * @property {String} [dateLocale='en'] The region (example: 'ru' or 'en') to format the date and time. Default: 'en'.
 * @property {UpdaterOptions} [updater=UpdaterOptions] Update Checker options object.
 * @property {ErrorHandlerOptions} [errorHandler=ErrorHandlerOptions] Error Handler options object.
 * @property {CheckerOptions} [optionsChecker=CheckerOptions] Options object for an 'Economy.utils.checkOptions' method.
 */

/**
 * Inventory manager class.
 * @type {InventoryManager}
 */
module.exports = InventoryManager
const capitalize = require('../generatorUtils/capitalize')
const filterBackendProperties = require('../generatorUtils/filterBackendProperties')
const componentField = require('../generatorUtils/componentField')
const {generateDataCombos, generateImportCombos, generateMethodsCombos, generateMountedCombos} = require('../generatorUtils/componentFieldCombos')
const importMomentIfDateExist = require('../generatorUtils/importMomentIfDateExist')
const getI18nKey = require('./../generatorUtils/getI18nKey')
module.exports = function (model,moduleName) {
    let content =
        `<template>
    <v-card tile>

        <v-toolbar flat color="primary">
            <v-toolbar-title class="onPrimary--text">{{title}}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn icon color="primary" class="onPrimary--text" @click="$emit('closeDialog')">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        
        <v-card-text class="pt-3">
            <v-alert v-if="errorMessage" type="error" dense text>{{errorMessage}}</v-alert>
        </v-card-text>

        <v-card-text>
            <v-form ref="form" autocomplete="off" @submit.prevent="save">

                <v-row>
    
                   ${generateFields(model.properties, model.name, moduleName)}
                    
                </v-row>


            </v-form>
        </v-card-text>


        <v-card-actions>

            <v-btn tile outlined color="grey"  @click="$emit('closeDialog')">
                Cerrar
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn   color="secondary" class="onSecondary--text" @click="save" :loading="loading">
                Modificar
            </v-btn>

        </v-card-actions>

    </v-card>
</template>

<script>
    import ${model.name}Provider from "../providers/${model.name}Provider";
    import {ClientError} from 'front-module-commons';
  
    //Relations
    ${generateImportCombos(model.properties)}
    
    //Handle Dates 
    ${importMomentIfDateExist(model.properties)}

    export default {
        name: "${model.name}Update",
        props: {
            item: Object
        },
        data() {
            return {
                modal: false,
                title: this.$t('${getI18nKey(moduleName,model.name,'editing')}'),
                errorMessage: '',
                inputErrors: {},
                loading: false,
                form: {
                     id: this.item.id,
                    ${generateFormObjectFields(model.properties)}
                },
                rules: {
                    required: value => !!value || 'Requerido'
                },
                ${generateDataCombos(model.properties)}
            }
        },
        mounted() {
         ${generateMountedCombos(model.properties)}
        },
        computed: {
            hasErrors() {
                return field => this.inputErrors[field] != undefined
            },
            getMessageErrors() {
                return field => {
                    if (this.inputErrors[field] != undefined) {
                        let message = this.inputErrors[field].message
                        return [message]
                    }
                    return []
                }
            },
        },
        methods: {
            save() {
                if (this.$refs.form.validate()) {
                    ${model.name}Provider.update${model.name}(this.form).then(r => {
                            if (r) {
                                this.$emit('itemUpdate',r.data.${model.name.toLowerCase()}Update)
                                this.$emit('closeDialog')
                            }
                        }
                    ).catch(error => {
                         let clientError = new ClientError(error)
                         this.inputErrors = clientError.inputErrors
                         this.errorMessage = clientError.showMessage
                    })
                }

            },
            ${generateMethodsCombos(model.properties)}
        },
    }
</script>

<style scoped>

</style>

`

    return content
}


function generateFormObjectFields(properties) {

    let propFiltered = filterBackendProperties(properties);

    return propFiltered.map(field => {
        switch(field.type){
            case 'Date':
                return `${field.name}: moment(parseInt(this.item.${field.name})).format('YYYY-MM-DD')`
            case 'ObjectId':
                return `${field.name}: this.item.${field.name}.id`
            default:
                return `${field.name}: this.item.${field.name}`
        }
    }).join(',\n                    ')
}



function generateFields(properties, modelName, moduleName) {
    let propFiltered = filterBackendProperties(properties);

    return propFiltered.map(field => {
        return componentField(field, modelName, moduleName)
    }).join('\n ')

}
